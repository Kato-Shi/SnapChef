export type Recipe = {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: string;
  accent: string;
};

import { filipinoRecipes } from "./filipino-recipes";
import { worldRecipes } from "./world-recipes";

export const recipes: Recipe[] = [
  {
    id: "chicken-adobo",
    name: "Chicken Adobo",
    description: "Tender chicken braised in a punchy soy-vinegar sauce.",
    ingredients: ["chicken", "soy sauce", "vinegar", "garlic", "bay leaf", "black pepper"],
    instructions: ["Combine chicken, soy sauce, vinegar, garlic, bay leaf, and pepper in a pot.", "Simmer covered for 25 minutes.", "Uncover and reduce the sauce until glossy."],
    cookingTime: "40 min",
    accent: "#c66748",
  },
  {
    id: "pork-adobo",
    name: "Pork Adobo",
    description: "A rich, savory Filipino classic with a tangy finish.",
    ingredients: ["pork", "soy sauce", "vinegar", "garlic", "bay leaf", "black pepper"],
    instructions: ["Brown the pork in a heavy pan.", "Add the remaining ingredients and enough water to nearly cover.", "Simmer until tender, then reduce the sauce."],
    cookingTime: "55 min",
    accent: "#934c38",
  },
  {
    id: "omelette",
    name: "Tortang Kamatis",
    description: "A home-style Filipino tomato and onion omelet.",
    ingredients: ["egg", "tomato", "onion", "butter", "salt"],
    instructions: ["Whisk eggs with a pinch of salt.", "Sauté tomato and onion in butter.", "Add eggs, cook gently, then fold."],
    cookingTime: "12 min",
    accent: "#d8a13b",
  },
  {
    id: "garlic-fried-rice",
    name: "Garlic Fried Rice",
    description: "Fragrant, golden rice with crisp bits of garlic.",
    ingredients: ["rice", "garlic", "oil", "salt", "green onion"],
    instructions: ["Fry sliced garlic in oil until golden; reserve half.", "Add cold rice and toss over high heat.", "Season, then finish with green onion and crisp garlic."],
    cookingTime: "15 min",
    accent: "#b5964b",
  },
  {
    id: "egg-fried-rice",
    name: "Sinangag with Egg",
    description: "Garlicky Filipino fried rice tossed with fluffy egg.",
    ingredients: ["rice", "egg", "soy sauce", "green onion", "oil"],
    instructions: ["Scramble the egg in a hot wok and set aside.", "Stir-fry rice with oil and soy sauce.", "Return egg, add green onion, and toss."],
    cookingTime: "15 min",
    accent: "#c9a235",
  },
  {
    id: "chicken-curry",
    name: "Filipino Chicken Curry",
    description: "Mild coconut chicken curry with potato and bell pepper.",
    ingredients: ["chicken", "coconut milk", "curry powder", "onion", "garlic", "potato", "bell pepper", "fish sauce"],
    instructions: ["Sauté onion and garlic, then toast curry powder.", "Add chicken and brown lightly.", "Add coconut milk and potato; simmer until tender."],
    cookingTime: "40 min",
    accent: "#d98e25",
  },
  {
    id: "spaghetti",
    name: "Filipino Spaghetti",
    description: "Sweet-savory party spaghetti with hotdogs and cheese.",
    ingredients: ["spaghetti", "ground pork", "hotdog", "tomato sauce", "banana ketchup", "garlic", "onion", "cheese"],
    instructions: ["Boil spaghetti until tender, then drain.", "Brown pork and hotdogs with garlic and onion.", "Add tomato sauce and banana ketchup; toss with pasta and finish with cheese."],
    cookingTime: "25 min",
    accent: "#d6573f",
  },
  {
    id: "pancakes",
    name: "Filipino Hotcakes",
    description: "Soft street-style hotcakes brushed with margarine and sugar.",
    ingredients: ["flour", "egg", "milk", "sugar", "butter", "baking powder"],
    instructions: ["Whisk flour, sugar, and baking powder.", "Mix in egg, milk, and melted butter.", "Cook small rounds on a buttered pan until golden."],
    cookingTime: "20 min",
    accent: "#bf7b43",
  },
  {
    id: "fried-chicken",
    name: "Pinoy Fried Chicken",
    description: "Calamansi-marinated chicken with a crisp seasoned crust.",
    ingredients: ["chicken", "calamansi", "soy sauce", "garlic", "flour", "egg", "oil", "black pepper"],
    instructions: ["Season chicken and dip in egg mixed with milk.", "Coat thoroughly in seasoned flour.", "Fry until crisp, golden, and cooked through."],
    cookingTime: "45 min",
    accent: "#a86b36",
  },
  {
    id: "vegetable-stir-fry",
    name: "Filipino Chopsuey",
    description: "Colorful vegetables and quail eggs in a light savory sauce.",
    ingredients: ["cabbage", "carrot", "bell pepper", "green beans", "cauliflower", "quail egg", "garlic", "soy sauce"],
    instructions: ["Cut vegetables into even pieces.", "Stir-fry garlic and vegetables over high heat.", "Add soy sauce and toss until crisp-tender."],
    cookingTime: "18 min",
    accent: "#668557",
  },
  ...filipinoRecipes,
  ...worldRecipes,
];
