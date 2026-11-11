"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent, MouseEvent } from "react";
import { analyzeFoodImage, type FoodImageAnalysis } from "../../app/lib/image-analyzer";
import { getRecipeDetails } from "../../app/lib/recipe-details";
import { rankRecipes, normalizeIngredient, type RecipeMatch } from "../../app/lib/recipe-matcher";
import { recipes } from "../../app/lib/recipes";
import { worldRecipes } from "../../app/lib/world-recipes";

const worldRecipeIds = new Set(worldRecipes.map((recipe) => recipe.id));
const imageRecognitionEnabled = import.meta.env?.VITE_IMAGE_RECOGNITION_ENABLED !== "false";
const categories = ["All", "Filipino", "Global", "Quick", "Vegetarian", "Seafood", "Soups & stews", "Saved", "Recent"] as const;
type Category = (typeof categories)[number];
type DifficultyFilter = "Any" | "Easy" | "Moderate" | "Advanced";
type TimeFilter = "Any" | "30" | "60";
type HistoryEntry = { id: string; viewedAt: number; cookedAt?: number };
type ShoppingItem = { item: string; checked: boolean };
const meatIngredients = ["beef", "pork", "chicken", "lamb", "fish", "shrimp", "mussels", "sausage", "bacon", "hotdog", "tuna", "sardines", "anchovy", "squid", "crab", "meat"];
const seafoodIngredients = ["fish", "shrimp", "mussels", "tuna", "sardines", "anchovy", "squid", "crab", "seafood"];

function isRecipeInCategory(recipe: RecipeMatch, category: Category, favorites: Set<string>, recent: Set<string>) {
  const ingredientsText = recipe.ingredients.join(" ").toLowerCase();
  if (category === "All") return true;
  if (category === "Filipino") return !worldRecipeIds.has(recipe.id);
  if (category === "Global") return worldRecipeIds.has(recipe.id);
  if (category === "Quick") return Number.parseInt(recipe.cookingTime, 10) <= 30;
  if (category === "Vegetarian") return !meatIngredients.some((item) => ingredientsText.includes(item));
  if (category === "Seafood") return seafoodIngredients.some((item) => ingredientsText.includes(item));
  if (category === "Soups & stews") return /soup|stew|sinigang|nilaga|tinola|bulalo|batchoy|mami|sopas|pochero|kare-kare|dinuguan|jjigae|pho|wat|goulash|tagine|feijoada/i.test(recipe.name);
  if (category === "Saved") return favorites.has(recipe.id);
  return recent.has(recipe.id);
}

const fractionValues: Record<string, number> = { "¼": .25, "½": .5, "¾": .75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": .125, "⅜": .375, "⅝": .625, "⅞": .875 };
function scaleAmount(amount: string, servings: number) {
  if (servings === 4) return amount;
  const factor = servings / 4;
  const quantityPattern = /(\d+)?\s*([¼½¾⅓⅔⅛⅜⅝⅞])|\d+(?:\.\d+)?/g;
  let matchIndex = 0;
  return amount.replace(quantityPattern, (match, whole: string | undefined, fraction: string | undefined) => {
    matchIndex += 1;
    if (/\beach\b/i.test(amount) && matchIndex > 1) return match;
    const value = fraction ? (Number(whole || 0) + fractionValues[fraction]) : Number(match);
    const scaled = Math.round(value * factor * 100) / 100;
    return Number.isInteger(scaled) ? String(scaled) : String(scaled).replace(".25", "¼").replace(".5", "½").replace(".75", "¾");
  });
}

export default function Home() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [recipeQuery, setRecipeQuery] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [shoppingInput, setShoppingInput] = useState("");
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("Any");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("Any");
  const [completeOnly, setCompleteOnly] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState<FoodImageAnalysis | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeMatch | null>(null);
  const [selectedServings, setSelectedServings] = useState(4);
  const [cookingStep, setCookingStep] = useState<number | null>(null);
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
        const savedHistory: unknown = JSON.parse(localStorage.getItem("snapchef.history.v1") ?? "[]");
        const savedShopping: unknown = JSON.parse(localStorage.getItem("snapchef.shopping.v1") ?? "[]");
        if (Array.isArray(savedIngredients)) setIngredients(Array.from(new Set(savedIngredients.filter((item): item is string => typeof item === "string").map(normalizeIngredient).filter(Boolean))).slice(0, 200));
        if (Array.isArray(savedFavorites)) setFavorites(new Set(savedFavorites.filter((item): item is string => typeof item === "string")));
        if (Array.isArray(savedHistory)) setHistory(savedHistory.filter((item): item is HistoryEntry => Boolean(item && typeof item === "object" && typeof (item as HistoryEntry).id === "string" && typeof (item as HistoryEntry).viewedAt === "number")).slice(0, 20));
        if (Array.isArray(savedShopping)) setShoppingItems(savedShopping.filter((entry): entry is ShoppingItem => Boolean(entry && typeof entry === "object" && typeof (entry as ShoppingItem).item === "string" && typeof (entry as ShoppingItem).checked === "boolean")).slice(0, 100));
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
      localStorage.setItem("snapchef.history.v1", JSON.stringify(history));
      localStorage.setItem("snapchef.shopping.v1", JSON.stringify(shoppingItems));
    } catch { queueMicrotask(() => setNotice("Storage is unavailable. Your kitchen data will last for this visit only.")); }
  }, [ingredients, favorites, history, shoppingItems, loaded]);

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
  const recentIds = useMemo(() => new Set(history.map((entry) => entry.id)), [history]);
  const visibleRecipes = useMemo(() => {
    const query = recipeQuery.trim().toLowerCase();
    const filtered = rankedRecipes.filter((recipe) => {
      const searchable = `${recipe.name} ${recipe.description} ${recipe.ingredients.join(" ")}`.toLowerCase();
      const details = getRecipeDetails(recipe);
      const withinTime = timeFilter === "Any" || Number.parseInt(recipe.cookingTime, 10) <= Number(timeFilter);
      const withinDifficulty = difficultyFilter === "Any" || details.difficulty === difficultyFilter;
      const hasEverything = !completeOnly || recipe.missingIngredients.length === 0;
      return (!query || searchable.includes(query)) && isRecipeInCategory(recipe, category, favorites, recentIds) && withinTime && withinDifficulty && hasEverything;
    });
    if (category === "Recent") {
      const position = new Map(history.map((entry, index) => [entry.id, index]));
      return filtered.sort((a, b) => (position.get(a.id) ?? 999) - (position.get(b.id) ?? 999));
    }
    return filtered;
  }, [rankedRecipes, recipeQuery, category, favorites, recentIds, history, timeFilter, difficultyFilter, completeOnly]);
  const isBrowsing = hasSearched || recipeQuery.trim().length > 0 || category !== "All" || timeFilter !== "Any" || difficultyFilter !== "Any" || completeOnly;
  const selectedDetails = useMemo(() => selectedRecipe ? getRecipeDetails(selectedRecipe) : null, [selectedRecipe]);

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
    setNotice(""); setImageAnalysis(null);
    if (preview) URL.revokeObjectURL(preview);
    setImage(file); setPreview(URL.createObjectURL(file));
  };
  const removeImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setImage(null); setPreview(null); setImageAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const analyzeImage = async () => {
    if (!image) return;
    setAnalyzing(true); setNotice(""); setImageAnalysis(null);
    try {
      const result = await analyzeFoodImage(image);
      setImageAnalysis(result);
      setIngredients((current) => Array.from(new Set([...current, ...result.ingredients.map(normalizeIngredient).filter(Boolean)])));
      setHasSearched(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "The photo could not be analyzed.";
      if (msg.includes("not been configured yet")) {
        setNotice("GEMINI_USE_API_KEY is not configured yet. Add your Gemini API key in Settings > Secrets (or .env) to enable live photo recognition.");
      } else {
        setNotice(msg);
      }
    } finally { setAnalyzing(false); }
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
  const openRecipe = (recipe: RecipeMatch) => {
    setSelectedServings(4); setCookingStep(null); setSelectedRecipe(recipe);
    setHistory((current) => [{ id: recipe.id, viewedAt: Date.now(), cookedAt: current.find((item) => item.id === recipe.id)?.cookedAt }, ...current.filter((item) => item.id !== recipe.id)].slice(0, 20));
  };
  const finishCooking = () => {
    if (!selectedRecipe) return;
    setHistory((current) => [{ id: selectedRecipe.id, viewedAt: Date.now(), cookedAt: Date.now() }, ...current.filter((item) => item.id !== selectedRecipe.id)].slice(0, 20));
    setCookingStep(null); setNotice(`${selectedRecipe.name} marked as cooked.`);
  };
  const addShoppingItems = (items: string[]) => {
    setShoppingItems((current) => {
      const existing = new Set(current.map((entry) => normalizeIngredient(entry.item)));
      const additions = items.map(normalizeIngredient).filter((item) => item && !existing.has(item)).map((item) => ({ item, checked: false }));
      return [...current, ...additions].slice(0, 100);
    });
  };
  const submitShoppingItem = (event: FormEvent) => {
    event.preventDefault();
    if (!shoppingInput.trim()) return;
    addShoppingItems([shoppingInput]); setShoppingInput("");
  };
  const keyboardUpload = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInputRef.current?.click(); }
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="SnapChef home" onClick={() => { setRecipeQuery(""); setCategory("All"); setHasSearched(false); }}><span className="brand-mark">S</span><span>SnapChef</span></a>
        <div className="header-actions"><span className="prototype-label">Your pocket kitchen</span><button type="button" onClick={() => setShowShoppingList(true)}>Shopping list{shoppingItems.length ? ` (${shoppingItems.filter((item) => !item.checked).length})` : ""}</button></div>
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
              {categories.map((item) => <option key={item} value={item}>{item}{item === "Saved" && favorites.size > 0 ? ` (${favorites.size})` : item === "Recent" && history.length > 0 ? ` (${history.length})` : ""}</option>)}
            </select>
            <span aria-hidden="true">⌄</span>
          </div>
        </div>
        <div className="advanced-filters" aria-label="Recipe filters">
          <label>Time<select value={timeFilter} onChange={(event) => setTimeFilter(event.target.value as TimeFilter)}><option value="Any">Any length</option><option value="30">30 min or less</option><option value="60">60 min or less</option></select></label>
          <label>Difficulty<select value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value as DifficultyFilter)}><option>Any</option><option>Easy</option><option>Moderate</option><option>Advanced</option></select></label>
          <label className="checkbox-filter"><input type="checkbox" checked={completeOnly} onChange={(event) => setCompleteOnly(event.target.checked)} /><span>I have everything</span></label>
          {(timeFilter !== "Any" || difficultyFilter !== "Any" || completeOnly) && <button type="button" onClick={() => { setTimeFilter("Any"); setDifficultyFilter("Any"); setCompleteOnly(false); }}>Reset filters</button>}
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
            <p className="helper-copy">Ingredients and saved recipes stay on this device. Dish recognition is coming soon; selected photos are not uploaded while it is unavailable.</p>
            <input ref={fileInputRef} className="sr-only" id="food-photo" type="file" accept="image/jpeg,image/png" onChange={chooseImage} />
            {!preview ? (
              <div className="photo-zone" role="button" tabIndex={0} onClick={() => fileInputRef.current?.click()} onKeyDown={keyboardUpload}><span className="photo-icon">↗</span><span><strong>Upload a kitchen photo</strong><small>JPG or PNG</small></span></div>
            ) : (
              <div className="photo-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Selected kitchen ingredients" />
                <div className="photo-actions"><span>{image?.name}</span><button type="button" onClick={() => fileInputRef.current?.click()}>Replace</button><button type="button" onClick={removeImage}>Remove</button></div>
                <button className="analyze-action" type="button" onClick={analyzeImage} disabled={!imageRecognitionEnabled || analyzing}>{analyzing ? "Identifying this dish…" : imageRecognitionEnabled ? "Identify this dish" : "Dish recognition coming soon"}</button>
                {imageAnalysis && <div className="image-results" aria-live="polite"><strong>{imageAnalysis.candidates.length === 1 ? "Dish identified" : "Possible dishes"}</strong>{imageAnalysis.candidates.length > 0 ? <ol>{imageAnalysis.candidates.map((candidate) => <li key={candidate.name}><button type="button" onClick={() => { setRecipeQuery(candidate.name); setHasSearched(true); }}><span>{candidate.name}</span><small>{candidate.confidence}% likely · {candidate.reason}</small></button></li>)}</ol> : <p>{imageAnalysis.message}</p>}<small>Tap a dish to search the recipe collection. Detected ingredients were added above.</small></div>}
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
              <button type="button" className="recipe-open-area" onClick={() => openRecipe(recipe)}>
                <span className="recipe-index">{String(index + 1).padStart(2, "0")}</span>
                {ingredients.length > 0 ? <div className="match-ring" style={{ "--match": `${recipe.matchPercentage * 3.6}deg`, "--accent": recipe.accent } as React.CSSProperties}><span>{recipe.matchPercentage}%</span></div> : <div className="dish-monogram" style={{ background: recipe.accent }}>{recipe.name.charAt(0)}</div>}
                <div className="recipe-card-copy"><p>{recipe.cookingTime} · {worldRecipeIds.has(recipe.id) ? "Global" : "Filipino"}{history.find((item) => item.id === recipe.id)?.cookedAt ? " · Cooked" : ""}</p><h3>{recipe.name}</h3><span>{recipe.description}</span>{ingredients.length > 0 && <div className="mini-tags">{recipe.matchedIngredients.slice(0, 3).map((item) => <small key={item}>✓ {item}</small>)}{recipe.missingIngredients.length > 0 && <small className="missing">+{recipe.missingIngredients.length} missing</small>}</div>}</div>
                <span className="open-recipe">Open recipe →</span>
              </button>
            </article>
          ))}</div> : <div className="empty-state"><span>⌕</span><h3>No recipes found</h3><p>Try another name, ingredient, or category.</p><button type="button" onClick={() => { setRecipeQuery(""); setCategory("All"); }}>Show all recipes</button></div>}
        </section>
      )}

      {selectedRecipe && selectedDetails && (
        <dialog ref={dialogRef} className="recipe-modal" aria-labelledby="recipe-title" onCancel={() => setSelectedRecipe(null)}>
          <button type="button" className="modal-close" onClick={() => setSelectedRecipe(null)} aria-label="Close recipe">×</button>
          <div className="modal-intro" style={{ borderColor: selectedRecipe.accent }}>
            <p className="eyebrow">{ingredients.length ? `${selectedRecipe.matchPercentage}% match · ` : ""}{selectedRecipe.cookingTime}</p>
            <h2 id="recipe-title">{selectedRecipe.name}</h2>
            <p>{selectedRecipe.description}</p>
            <div className="recipe-facts" aria-label="Recipe information"><span className="serving-control"><small>Serves</small><span><button type="button" onClick={() => setSelectedServings((value) => Math.max(1, value - 1))} aria-label="Decrease servings">−</button><strong>{selectedServings}</strong><button type="button" onClick={() => setSelectedServings((value) => Math.min(12, value + 1))} aria-label="Increase servings">+</button></span></span><span><small>Prep</small><strong>{selectedDetails.prepTime}</strong></span><span><small>Cook</small><strong>{selectedRecipe.cookingTime}</strong></span><span><small>Level</small><strong>{selectedDetails.difficulty}</strong></span></div>
            <button type="button" className={`modal-save ${favorites.has(selectedRecipe.id) ? "saved" : ""}`} aria-pressed={favorites.has(selectedRecipe.id)} onClick={() => toggleFavorite(selectedRecipe.id)}>{favorites.has(selectedRecipe.id) ? "♥ Saved" : "♡ Save recipe"}</button>
            <button type="button" className="start-cooking" onClick={() => setCookingStep(0)}>Start cooking mode →</button>
            {selectedRecipe.missingIngredients.length > 0 && <button type="button" className="add-shopping" onClick={() => { addShoppingItems(selectedRecipe.missingIngredients); setShowShoppingList(true); }}>Add {selectedRecipe.missingIngredients.length} missing item{selectedRecipe.missingIngredients.length === 1 ? "" : "s"} to shopping list</button>}
          </div>
          <div className="recipe-guide-note"><strong>Four-serving guide</strong><p>{selectedDetails.cookNote}</p></div>
          <div className="recipe-detail-grid">
            <section>
              <p className="eyebrow">Measured ingredients</p>
              <ul className="measured-ingredients">{selectedDetails.ingredients.map((ingredient) => <li key={ingredient.item} className={selectedRecipe.matchedIngredients.includes(ingredient.item) ? "have" : "need"}><span>{selectedRecipe.matchedIngredients.includes(ingredient.item) ? "✓" : "○"}</span><div><strong>{scaleAmount(ingredient.amount, selectedServings)}</strong><p>{ingredient.item}</p>{ingredient.preparation && <small>{ingredient.preparation}</small>}</div></li>)}</ul>
              <div className="equipment-list"><p className="eyebrow">Equipment</p><ul>{selectedDetails.equipment.map((item) => <li key={item}>{item}</li>)}</ul></div>
            </section>
            <section>
              <p className="eyebrow">Detailed method</p>
              <ol>{selectedDetails.steps.map((step, index) => <li key={`${index}-${step}`}><span>{index + 1}</span><p>{step}</p></li>)}</ol>
              {selectedDetails.safetyNote && <aside className="safety-note"><strong>Doneness check</strong><p>{selectedDetails.safetyNote}</p></aside>}
            </section>
          </div>
          {cookingStep !== null && <section className="cooking-mode" aria-label="Cooking mode"><button type="button" className="cooking-exit" onClick={() => setCookingStep(null)}>Exit</button><p className="eyebrow">Cooking {selectedRecipe.name}</p><div className="cooking-progress" aria-label={`Step ${cookingStep + 1} of ${selectedDetails.steps.length}`}><span style={{ width: `${((cookingStep + 1) / selectedDetails.steps.length) * 100}%` }} /></div><p className="cooking-count">Step {cookingStep + 1} of {selectedDetails.steps.length}</p><h3>{selectedDetails.steps[cookingStep]}</h3><div className="cooking-nav"><button type="button" disabled={cookingStep === 0} onClick={() => setCookingStep((step) => Math.max(0, (step ?? 0) - 1))}>← Previous</button>{cookingStep === selectedDetails.steps.length - 1 ? <button type="button" onClick={finishCooking}>Finish cooking ✓</button> : <button type="button" onClick={() => setCookingStep((step) => Math.min(selectedDetails.steps.length - 1, (step ?? 0) + 1))}>Next step →</button>}</div><small>Amounts in the recipe are adjusted for {selectedServings} serving{selectedServings === 1 ? "" : "s"}.</small></section>}
        </dialog>
      )}

      {showShoppingList && <section className="shopping-panel" aria-labelledby="shopping-title"><button type="button" className="shopping-backdrop" aria-label="Close shopping list" onClick={() => setShowShoppingList(false)} /><aside><div className="shopping-heading"><div><p className="eyebrow">On this device</p><h2 id="shopping-title">Shopping list</h2></div><button type="button" onClick={() => setShowShoppingList(false)} aria-label="Close shopping list">×</button></div><form onSubmit={submitShoppingItem}><label className="sr-only" htmlFor="shopping-input">Add shopping item</label><input id="shopping-input" value={shoppingInput} maxLength={80} onChange={(event) => setShoppingInput(event.target.value)} placeholder="Add an item…" /><button type="submit" disabled={!shoppingInput.trim()}>Add</button></form>{shoppingItems.length ? <><ul>{shoppingItems.map((entry) => <li key={entry.item} className={entry.checked ? "checked" : ""}><label><input type="checkbox" checked={entry.checked} onChange={() => setShoppingItems((current) => current.map((item) => item.item === entry.item ? { ...item, checked: !item.checked } : item))} /><span>{entry.item}</span></label><button type="button" onClick={() => setShoppingItems((current) => current.filter((item) => item.item !== entry.item))} aria-label={`Remove ${entry.item}`}>×</button></li>)}</ul><div className="shopping-footer"><span>{shoppingItems.filter((item) => !item.checked).length} remaining</span><button type="button" onClick={() => setShoppingItems((current) => current.filter((item) => !item.checked))} disabled={!shoppingItems.some((item) => item.checked)}>Clear checked</button></div></> : <div className="shopping-empty"><strong>Your list is empty</strong><p>Add an item here or add missing ingredients from a recipe.</p></div>}</aside></section>}
    </main>
  );
}
