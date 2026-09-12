"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent, MouseEvent } from "react";
import { analyzeFoodImage } from "../../app/lib/image-analyzer";
import { rankRecipes, normalizeIngredient, type RecipeMatch } from "../../app/lib/recipe-matcher";
import { recipes } from "../../app/lib/recipes";
import { worldRecipes } from "../../app/lib/world-recipes";

const worldRecipeIds = new Set(worldRecipes.map((recipe) => recipe.id));
const categories = ["All", "Filipino", "Global", "Quick", "Vegetarian", "Seafood", "Soups & stews", "Saved"] as const;
type Category = (typeof categories)[number];
const meatIngredients = ["beef", "pork", "chicken", "lamb", "fish", "shrimp", "mussels", "sausage", "bacon", "hotdog", "tuna", "sardines", "anchovy", "squid", "crab", "meat"];
const seafoodIngredients = ["fish", "shrimp", "mussels", "tuna", "sardines", "anchovy", "squid", "crab", "seafood"];

function isRecipeInCategory(recipe: RecipeMatch, category: Category, favorites: Set<string>) {
  const ingredientsText = recipe.ingredients.join(" ").toLowerCase();
  if (category === "All") return true;
  if (category === "Filipino") return !worldRecipeIds.has(recipe.id);
  if (category === "Global") return worldRecipeIds.has(recipe.id);
  if (category === "Quick") return Number.parseInt(recipe.cookingTime, 10) <= 30;
  if (category === "Vegetarian") return !meatIngredients.some((item) => ingredientsText.includes(item));
  if (category === "Seafood") return seafoodIngredients.some((item) => ingredientsText.includes(item));
  if (category === "Soups & stews") return /soup|stew|sinigang|nilaga|tinola|bulalo|batchoy|mami|sopas|pochero|kare-kare|dinuguan|jjigae|pho|wat|goulash|tagine|feijoada/i.test(recipe.name);
  return favorites.has(recipe.id);
}

export default function Home() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [recipeQuery, setRecipeQuery] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeMatch | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const savedIngredients: unknown = JSON.parse(localStorage.getItem("snapchef.ingredients.v1") ?? "[]");
        const savedFavorites: unknown = JSON.parse(localStorage.getItem("snapchef.favorites.v1") ?? "[]");
        if (Array.isArray(savedIngredients)) setIngredients(Array.from(new Set(savedIngredients.filter((item): item is string => typeof item === "string").map(normalizeIngredient).filter(Boolean))).slice(0, 200));
        if (Array.isArray(savedFavorites)) setFavorites(new Set(savedFavorites.filter((item): item is string => typeof item === "string")));
      } catch { setNotice("Saved kitchen data could not be loaded. You can still start a new list."); }
      setLoaded(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const isStaticBuild = document.querySelector('meta[name="snapchef-static-build"]');
    if (isStaticBuild && "serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js").catch(() => setNotice("Offline mode is unavailable, but SnapChef can still be used online."));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("snapchef.ingredients.v1", JSON.stringify(ingredients));
      localStorage.setItem("snapchef.favorites.v1", JSON.stringify([...favorites]));
    } catch { queueMicrotask(() => setNotice("Storage is unavailable. Your kitchen data will last for this visit only.")); }
  }, [ingredients, favorites, loaded]);

  useEffect(() => {
    if (!selectedRecipe) return;
    const dialog = dialogRef.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, [selectedRecipe]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const rankedRecipes = useMemo(() => rankRecipes(ingredients, recipes), [ingredients]);
  const visibleRecipes = useMemo(() => {
    const query = recipeQuery.trim().toLowerCase();
    return rankedRecipes.filter((recipe) => {
      const searchable = `${recipe.name} ${recipe.description} ${recipe.ingredients.join(" ")}`.toLowerCase();
      return (!query || searchable.includes(query)) && isRecipeInCategory(recipe, category, favorites);
    });
  }, [rankedRecipes, recipeQuery, category, favorites]);
  const isBrowsing = hasSearched || recipeQuery.trim().length > 0 || category !== "All";

  const addIngredient = (value = input) => {
    const normalized = normalizeIngredient(value);
    if (!normalized || ingredients.includes(normalized)) return;
    setIngredients((current) => [...current, normalized]);
    setInput("");
    setHasSearched(false);
  };
  const submitIngredient = (event: FormEvent) => { event.preventDefault(); addIngredient(); };
  const removeIngredient = (ingredient: string) => { setIngredients((current) => current.filter((item) => item !== ingredient)); setHasSearched(false); };
  const clearIngredients = () => { setIngredients([]); setHasSearched(false); };

  const chooseImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setNotice("Choose a JPG or PNG smaller than 10 MB."); event.target.value = ""; return;
    }
    setNotice("");
    if (preview) URL.revokeObjectURL(preview);
    setImage(file); setPreview(URL.createObjectURL(file));
  };
  const removeImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setImage(null); setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const analyzeImage = async () => {
    if (!image) return;
    setAnalyzing(true);
    const detected = await analyzeFoodImage(image);
    setIngredients((current) => Array.from(new Set([...current, ...detected.map(normalizeIngredient)])));
    setAnalyzing(false); setHasSearched(false);
  };
  const findRecipes = () => {
    if (!ingredients.length) return;
    setHasSearched(true);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  const toggleFavorite = (id: string, event?: MouseEvent) => {
    event?.stopPropagation();
    setFavorites((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const keyboardUpload = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInputRef.current?.click(); }
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="SnapChef home" onClick={() => { setRecipeQuery(""); setCategory("All"); setHasSearched(false); }}><span className="brand-mark">S</span><span>SnapChef</span></a>
        <span className="prototype-label">Your pocket kitchen</span>
      </header>

      <section className="discovery-bar" id="top" aria-label="Browse recipes">
        <div className="recipe-search">
          <span aria-hidden="true">⌕</span>
          <label className="sr-only" htmlFor="recipe-search">Search recipes</label>
          <input id="recipe-search" type="search" value={recipeQuery} onChange={(event) => setRecipeQuery(event.target.value)} placeholder="Search recipes or ingredients…" />
          {recipeQuery && <button type="button" onClick={() => setRecipeQuery("")} aria-label="Clear recipe search">×</button>}
        </div>
        <div className="category-picker">
          <label htmlFor="recipe-category">Category</label>
          <div className="select-shell">
            <select id="recipe-category" value={category} onChange={(event) => setCategory(event.target.value as Category)}>
              {categories.map((item) => <option key={item} value={item}>{item}{item === "Saved" && favorites.size > 0 ? ` (${favorites.size})` : ""}</option>)}
            </select>
            <span aria-hidden="true">⌄</span>
          </div>
        </div>
      </section>

      {!isBrowsing && (
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Your ingredients, tonight’s dinner</p>
            <h1>Turn what you have into something <em>delicious.</em></h1>
            <p className="lede">Add ingredients from your kitchen—or snap a photo—and we’ll find the recipes that fit best.</p>
            <div className="hero-stats" aria-label="SnapChef highlights"><span><strong>{recipes.length}</strong> familiar recipes</span><span><strong>{favorites.size}</strong> saved recipes</span></div>
          </div>
          <div className="workspace-card">
            <div className="step-heading"><span>01</span><div><p className="eyebrow">Start here</p><h2>What’s in your kitchen?</h2></div></div>
            <form className="ingredient-field" onSubmit={submitIngredient}>
              <label className="sr-only" htmlFor="ingredient-input">Add an ingredient</label>
              <input id="ingredient-input" maxLength={80} disabled={!loaded} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Try egg, tomato, onion…" />
              <button type="submit" disabled={!loaded || !input.trim()}>Add</button>
            </form>
            {ingredients.length > 0 && <><div className="ingredient-list" aria-label="Your ingredients">{ingredients.map((ingredient) => <button key={ingredient} type="button" className="ingredient-chip" onClick={() => removeIngredient(ingredient)} aria-label={`Remove ${ingredient}`}>{ingredient}<span>×</span></button>)}</div><button className="clear-kitchen" type="button" onClick={clearIngredients}>Clear all</button></>}
            <div className="or-divider"><span>or</span></div>
            {notice && <p className="notice" role="status">{notice}</p>}
            <p className="helper-copy">Ingredients and saved recipes stay on this device. Photos stay in this session.</p>
            <input ref={fileInputRef} className="sr-only" id="food-photo" type="file" accept="image/jpeg,image/png" onChange={chooseImage} />
            {!preview ? (
              <div className="photo-zone" role="button" tabIndex={0} onClick={() => fileInputRef.current?.click()} onKeyDown={keyboardUpload}><span className="photo-icon">↗</span><span><strong>Upload a kitchen photo</strong><small>JPG or PNG</small></span></div>
            ) : (
              <div className="photo-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Selected kitchen ingredients" />
                <div className="photo-actions"><span>{image?.name}</span><button type="button" onClick={() => fileInputRef.current?.click()}>Replace</button><button type="button" onClick={removeImage}>Remove</button></div>
                <button className="analyze-action" type="button" onClick={analyzeImage} disabled={analyzing}>{analyzing ? "Looking at your photo…" : "Analyze photo (mock)"}</button>
              </div>
            )}
            <button className="primary-action" type="button" disabled={!ingredients.length} onClick={findRecipes}>Find my recipes <span>→</span></button>
            {!ingredients.length && <p className="helper-copy">Add at least one ingredient to begin.</p>}
          </div>
        </section>
      )}

      {!isBrowsing ? (
        <section className="preview-strip"><p className="eyebrow">A taste of what’s waiting</p><div className="dish-row">{recipes.slice(0, 3).map((recipe, index) => <article key={recipe.id}><span>0{index + 1}</span><h3>{recipe.name}</h3><p>{recipe.description}</p></article>)}</div></section>
      ) : (
        <section className="results-section browse-results" ref={resultsRef}>
          <div className="results-heading"><div><p className="eyebrow">{hasSearched ? "Your kitchen matches" : "Recipe collection"}</p><h2>{category === "All" ? "Recipes for you" : category}</h2></div><p>{visibleRecipes.length} recipe{visibleRecipes.length === 1 ? "" : "s"}{ingredients.length ? ` · ranked using ${ingredients.length} ingredient${ingredients.length === 1 ? "" : "s"}` : ""}</p></div>
          {visibleRecipes.length ? <div className="results-grid">{visibleRecipes.map((recipe, index) => (
            <article key={recipe.id} className="recipe-card">
              <button type="button" className={`favorite-button ${favorites.has(recipe.id) ? "saved" : ""}`} aria-label={`${favorites.has(recipe.id) ? "Remove" : "Save"} ${recipe.name}`} aria-pressed={favorites.has(recipe.id)} onClick={(event) => toggleFavorite(recipe.id, event)}>♥</button>
              <button type="button" className="recipe-open-area" onClick={() => setSelectedRecipe(recipe)}>
                <span className="recipe-index">{String(index + 1).padStart(2, "0")}</span>
                {ingredients.length > 0 ? <div className="match-ring" style={{ "--match": `${recipe.matchPercentage * 3.6}deg`, "--accent": recipe.accent } as React.CSSProperties}><span>{recipe.matchPercentage}%</span></div> : <div className="dish-monogram" style={{ background: recipe.accent }}>{recipe.name.charAt(0)}</div>}
                <div className="recipe-card-copy"><p>{recipe.cookingTime} · {worldRecipeIds.has(recipe.id) ? "Global" : "Filipino"}</p><h3>{recipe.name}</h3><span>{recipe.description}</span>{ingredients.length > 0 && <div className="mini-tags">{recipe.matchedIngredients.slice(0, 3).map((item) => <small key={item}>✓ {item}</small>)}{recipe.missingIngredients.length > 0 && <small className="missing">+{recipe.missingIngredients.length} missing</small>}</div>}</div>
                <span className="open-recipe">Open recipe →</span>
              </button>
            </article>
          ))}</div> : <div className="empty-state"><span>⌕</span><h3>No recipes found</h3><p>Try another name, ingredient, or category.</p><button type="button" onClick={() => { setRecipeQuery(""); setCategory("All"); }}>Show all recipes</button></div>}
        </section>
      )}

      {selectedRecipe && (
        <dialog ref={dialogRef} className="recipe-modal" aria-labelledby="recipe-title" onCancel={() => setSelectedRecipe(null)}>
          <button type="button" className="modal-close" onClick={() => setSelectedRecipe(null)} aria-label="Close recipe">×</button>
          <div className="modal-intro" style={{ borderColor: selectedRecipe.accent }}><p className="eyebrow">{ingredients.length ? `${selectedRecipe.matchPercentage}% match · ` : ""}{selectedRecipe.cookingTime}</p><h2 id="recipe-title">{selectedRecipe.name}</h2><p>{selectedRecipe.description}</p><button type="button" className={`modal-save ${favorites.has(selectedRecipe.id) ? "saved" : ""}`} aria-pressed={favorites.has(selectedRecipe.id)} onClick={() => toggleFavorite(selectedRecipe.id)}>{favorites.has(selectedRecipe.id) ? "♥ Saved" : "♡ Save recipe"}</button></div>
          <div className="recipe-detail-grid"><section><p className="eyebrow">Ingredients</p><ul>{selectedRecipe.ingredients.map((item) => <li key={item} className={selectedRecipe.matchedIngredients.includes(item) ? "have" : "need"}><span>{selectedRecipe.matchedIngredients.includes(item) ? "✓" : "○"}</span>{item}</li>)}</ul></section><section><p className="eyebrow">Method</p><ol>{selectedRecipe.instructions.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol></section></div>
        </dialog>
      )}
    </main>
  );
}
