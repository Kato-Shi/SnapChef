"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { analyzeFoodImage } from "./lib/image-analyzer";
import { rankRecipes, normalizeIngredient, type RecipeMatch } from "./lib/recipe-matcher";
import { recipes } from "./lib/recipes";

export default function Home() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeMatch | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const rankedRecipes = useMemo(
    () => rankRecipes(ingredients, recipes),
    [ingredients],
  );

  const addIngredient = (value = input) => {
    const normalized = normalizeIngredient(value);
    if (!normalized || ingredients.includes(normalized)) return;
    setIngredients((current) => [...current, normalized]);
    setInput("");
    setHasSearched(false);
  };

  const submitIngredient = (event: FormEvent) => {
    event.preventDefault();
    addIngredient();
  };

  const removeIngredient = (ingredient: string) => {
    setIngredients((current) => current.filter((item) => item !== ingredient));
    setHasSearched(false);
  };

  const chooseImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const analyzeImage = async () => {
    if (!image) return;
    setAnalyzing(true);
    const detected = await analyzeFoodImage(image);
    setIngredients((current) => Array.from(new Set([...current, ...detected.map(normalizeIngredient)])));
    setAnalyzing(false);
    setHasSearched(false);
  };

  const findRecipes = () => {
    if (!ingredients.length) return;
    setHasSearched(true);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const keyboardUpload = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="SnapChef home">
          <span className="brand-mark">S</span><span>SnapChef</span>
        </a>
        <span className="prototype-label">Kitchen prototype</span>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Your ingredients, tonight’s dinner</p>
          <h1>Turn what you have into something <em>delicious.</em></h1>
          <p className="lede">Add ingredients from your kitchen—or snap a photo—and we’ll find the recipes that fit best.</p>
          <div className="hero-stats" aria-label="SnapChef highlights">
            <span><strong>10</strong> familiar recipes</span>
            <span><strong>0</strong> food wasted</span>
          </div>
        </div>

        <div className="workspace-card">
          <div className="step-heading">
            <span>01</span>
            <div><p className="eyebrow">Start here</p><h2>What’s in your kitchen?</h2></div>
          </div>

          <form className="ingredient-field" onSubmit={submitIngredient}>
            <label className="sr-only" htmlFor="ingredient-input">Add an ingredient</label>
            <input id="ingredient-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Try egg, tomato, onion…" />
            <button type="submit" disabled={!input.trim()}>Add</button>
          </form>

          {ingredients.length > 0 && (
            <div className="ingredient-list" aria-label="Your ingredients">
              {ingredients.map((ingredient) => (
                <button key={ingredient} type="button" className="ingredient-chip" onClick={() => removeIngredient(ingredient)} aria-label={`Remove ${ingredient}`}>
                  {ingredient}<span>×</span>
                </button>
              ))}
            </div>
          )}

          <div className="or-divider"><span>or</span></div>
          <input ref={fileInputRef} className="sr-only" id="food-photo" type="file" accept="image/jpeg,image/png" onChange={chooseImage} />

          {!preview ? (
            <div className="photo-zone" role="button" tabIndex={0} onClick={() => fileInputRef.current?.click()} onKeyDown={keyboardUpload}>
              <span className="photo-icon">↗</span>
              <span><strong>Upload a kitchen photo</strong><small>JPG or PNG</small></span>
            </div>
          ) : (
            <div className="photo-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Selected kitchen ingredients" />
              <div className="photo-actions">
                <span>{image?.name}</span>
                <button type="button" onClick={() => fileInputRef.current?.click()}>Replace</button>
                <button type="button" onClick={removeImage}>Remove</button>
              </div>
              <button className="analyze-action" type="button" onClick={analyzeImage} disabled={analyzing}>
                {analyzing ? "Looking at your photo…" : "Analyze photo (mock)"}
              </button>
            </div>
          )}

          <button className="primary-action" type="button" disabled={!ingredients.length} onClick={findRecipes}>
            Find my recipes <span>→</span>
          </button>
          {!ingredients.length && <p className="helper-copy">Add at least one ingredient to begin.</p>}
        </div>
      </section>

      {!hasSearched ? (
        <section className="preview-strip">
          <p className="eyebrow">A taste of what’s waiting</p>
          <div className="dish-row">
            {recipes.slice(0, 3).map((recipe, index) => (
              <article key={recipe.id}>
                <span>0{index + 1}</span><h3>{recipe.name}</h3><p>{recipe.description}</p>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="results-section" ref={resultsRef}>
          <div className="results-heading">
            <div><p className="eyebrow">02 · Your matches</p><h2>Recipes ranked for your kitchen</h2></div>
            <p>Based on {ingredients.length} ingredient{ingredients.length === 1 ? "" : "s"}</p>
          </div>
          <div className="results-grid">
            {rankedRecipes.map((recipe, index) => (
              <button key={recipe.id} type="button" className="recipe-card" onClick={() => setSelectedRecipe(recipe)}>
                <span className="recipe-index">{String(index + 1).padStart(2, "0")}</span>
                <div className="match-ring" style={{ "--match": `${recipe.matchPercentage * 3.6}deg`, "--accent": recipe.accent } as React.CSSProperties}>
                  <span>{recipe.matchPercentage}%</span>
                </div>
                <div className="recipe-card-copy">
                  <p>{recipe.cookingTime}</p><h3>{recipe.name}</h3><span>{recipe.description}</span>
                  <div className="mini-tags">
                    {recipe.matchedIngredients.slice(0, 3).map((item) => <small key={item}>✓ {item}</small>)}
                    {recipe.missingIngredients.length > 0 && <small className="missing">+{recipe.missingIngredients.length} missing</small>}
                  </div>
                </div>
                <span className="open-recipe">Open recipe →</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedRecipe && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelectedRecipe(null)}>
          <article className="recipe-modal" role="dialog" aria-modal="true" aria-labelledby="recipe-title" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setSelectedRecipe(null)} aria-label="Close recipe">×</button>
            <div className="modal-intro" style={{ borderColor: selectedRecipe.accent }}>
              <p className="eyebrow">{selectedRecipe.matchPercentage}% match · {selectedRecipe.cookingTime}</p>
              <h2 id="recipe-title">{selectedRecipe.name}</h2>
              <p>{selectedRecipe.description}</p>
            </div>
            <div className="recipe-detail-grid">
              <section><p className="eyebrow">Ingredients</p><ul>{selectedRecipe.ingredients.map((item) => <li key={item} className={selectedRecipe.matchedIngredients.includes(item) ? "have" : "need"}><span>{selectedRecipe.matchedIngredients.includes(item) ? "✓" : "○"}</span>{item}</li>)}</ul></section>
              <section><p className="eyebrow">Method</p><ol>{selectedRecipe.instructions.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol></section>
            </div>
          </article>
        </div>
      )}
    </main>
  );
}
