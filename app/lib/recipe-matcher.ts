import type { Recipe } from "./recipes";

export const normalizeIngredient = (value: string) => value.trim().toLowerCase();

export type RecipeMatch = Recipe & {
  matchPercentage: number;
  matchedIngredients: string[];
  missingIngredients: string[];
};

export function rankRecipes(userIngredients: string[], recipes: Recipe[]): RecipeMatch[] {
  const available = new Set(userIngredients.map(normalizeIngredient));
  return recipes
    .map((recipe) => {
      const matchedIngredients = recipe.ingredients.filter((item) => available.has(normalizeIngredient(item)));
      const missingIngredients = recipe.ingredients.filter((item) => !available.has(normalizeIngredient(item)));
      return {
        ...recipe,
        matchedIngredients,
        missingIngredients,
        matchPercentage: Math.round((matchedIngredients.length / recipe.ingredients.length) * 100),
      };
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage || a.name.localeCompare(b.name));
}
