import type { Recipe } from "./recipes";

export type DetailedIngredient = {
  item: string;
  amount: string;
  preparation?: string;
};

export type RecipeDetails = {
  servings: number;
  prepTime: string;
  difficulty: "Easy" | "Moderate" | "Advanced";
  equipment: string[];
  ingredients: DetailedIngredient[];
  steps: string[];
  safetyNote: string | null;
  cookNote: string;
};

const quantityRules: Array<[RegExp, string]> = [
  [/whole chicken/i, "1 whole chicken (about 1.4 kg)"],
  [/chicken breast/i, "600 g chicken breast"],
  [/ground chicken/i, "500 g ground chicken"],
  [/chicken/i, "700 g boneless chicken pieces"],
  [/ground (beef|pork|lamb)/i, "500 g ground meat"],
  [/beef|pork|lamb/i, "600 g, cut into bite-size pieces"],
  [/fish fillet/i, "600 g fish fillets"],
  [/fish/i, "600 g cleaned fish"],
  [/shrimp|prawn/i, "450 g, peeled and deveined"],
  [/mussels/i, "700 g, scrubbed and debearded"],
  [/squid/i, "500 g, cleaned and sliced"],
  [/crab/i, "700 g cleaned crab pieces"],
  [/sausage|hotdog/i, "250 g, sliced"],
  [/bacon|guanciale/i, "180 g, cut into small strips"],
  [/tofu/i, "400 g firm tofu, drained"],
  [/eggplant/i, "2 medium, cut as directed"],
  [/zucchini/i, "2 medium, sliced"],
  [/potato/i, "500 g, peeled and cut evenly"],
  [/tomato sauce/i, "2 cups (480 ml)"],
  [/tomato paste/i, "2 tbsp"],
  [/tomato/i, "4 medium, chopped"],
  [/coconut milk/i, "1 can (400 ml)"],
  [/milk/i, "1½ cups (360 ml)"],
  [/cream/i, "¾ cup (180 ml)"],
  [/stock|broth|dashi/i, "4 cups (960 ml), kept hot"],
  [/water/i, "4 cups (960 ml), plus more as needed"],
  [/basmati rice|arborio rice/i, "1½ cups (300 g), rinsed if appropriate"],
  [/rice noodles/i, "300 g dried rice noodles"],
  [/lasagna noodles/i, "12 sheets"],
  [/spaghetti|macaroni|noodles|pasta/i, "350 g dried"],
  [/rice/i, "3 cups cooked, preferably cooled"],
  [/flour/i, "1½ cups (190 g)"],
  [/breadcrumbs/i, "1½ cups (150 g)"],
  [/tortilla/i, "8 medium"],
  [/pizza dough/i, "500 g"],
  [/pie crust/i, "1 prepared 23 cm crust"],
  [/lentils/i, "1½ cups (300 g), rinsed"],
  [/chickpeas|kidney beans|black beans/i, "2 cans (400 g each), drained"],
  [/green beans|bean sprouts|peas/i, "1½ cups"],
  [/cabbage|spinach|lettuce/i, "4 packed cups, washed and cut"],
  [/cauliflower/i, "1 small head, cut into florets"],
  [/mushroom/i, "300 g, wiped clean and sliced"],
  [/bell pepper|red pepper/i, "2 medium, seeded and sliced"],
  [/carrot/i, "2 medium, peeled and cut evenly"],
  [/celery/i, "2 stalks, finely chopped"],
  [/onion|shallot/i, "1 large, finely chopped"],
  [/green onion/i, "4 stalks, thinly sliced"],
  [/garlic/i, "6 cloves, minced"],
  [/ginger/i, "1 tbsp, finely grated"],
  [/chili|chile/i, "1–2, sliced; adjust to taste"],
  [/lemon|lime|calamansi/i, "3 tbsp freshly squeezed juice"],
  [/soy sauce/i, "¼ cup (60 ml)"],
  [/fish sauce/i, "2 tbsp"],
  [/vinegar/i, "¼ cup (60 ml)"],
  [/olive oil|sesame oil|oil/i, "2 tbsp, plus more if needed"],
  [/butter|ghee/i, "3 tbsp"],
  [/cheddar|mozzarella|parmesan|pecorino|cheese/i, "1½ cups (150 g), grated or crumbled"],
  [/yogurt/i, "¾ cup (180 g)"],
  [/egg/i, "4 large"],
  [/peanut butter/i, "½ cup (125 g)"],
  [/peanut/i, "½ cup (70 g), toasted"],
  [/sugar/i, "1 tbsp, then adjust to taste"],
  [/salt/i, "1 tsp, plus more to taste"],
  [/black pepper/i, "½ tsp freshly ground"],
  [/curry paste|doubanjiang|gochujang|miso paste/i, "3 tbsp"],
  [/curry powder|garam masala|paprika|cumin|turmeric|chili powder|gochugaru|berbere/i, "1½ tsp"],
  [/bay leaf/i, "2 leaves"],
  [/star anise/i, "2 whole"],
  [/saffron/i, "1 generous pinch, steeped in 2 tbsp warm water"],
  [/basil|cilantro|parsley|mint|thyme/i, "½ cup loosely packed, chopped if needed"],
  [/seaweed/i, "10 g dried, soaked and drained"],
  [/olive/i, "¾ cup, pitted"],
  [/preserved lemon/i, "1 small, rind thinly sliced"],
  [/kecap manis/i, "3 tbsp"],
  [/mirin/i, "3 tbsp"],
  [/worcestershire sauce/i, "1 tbsp"],
  [/banana ketchup/i, "¾ cup (180 ml)"],
  [/baking powder/i, "2 tsp"],
];

const priorityQuantityRules: Array<[RegExp, string]> = [
  [/fish sauce/i, "2 tbsp"],
  [/(chicken|beef|vegetable) stock/i, "4 cups (960 ml), kept hot"],
  [/preserved lemon/i, "1 small, rind thinly sliced"],
  [/peanut butter/i, "½ cup (125 g)"],
  [/tomato sauce/i, "2 cups (480 ml)"],
  [/tomato paste/i, "2 tbsp"],
  [/rice noodles/i, "300 g dried rice noodles"],
  [/lasagna noodles/i, "12 sheets"],
  [/curry paste|doubanjiang|gochujang|miso paste/i, "3 tbsp"],
];

function amountFor(item: string) {
  return priorityQuantityRules.find(([pattern]) => pattern.test(item))?.[1] ?? quantityRules.find(([pattern]) => pattern.test(item))?.[1] ?? "1 cup, prepared as listed";
}

function prepFor(item: string) {
  if (/onion|shallot|garlic|ginger|chili|herb|basil|cilantro|parsley|mint/i.test(item)) return "Prepare before heating the pan";
  if (/rice|lentils|beans|chickpeas/i.test(item)) return "Rinse and drain well unless already cooked";
  if (/chicken|beef|pork|lamb|fish|shrimp|prawn|mussels|squid|crab/i.test(item)) return "Keep chilled; pat dry before cooking";
  if (/vegetable|cabbage|carrot|pepper|tomato|potato|eggplant|zucchini|spinach/i.test(item)) return "Wash, dry, and cut into even pieces";
  return undefined;
}

function prepMinutes(recipe: Recipe) {
  const ingredientCount = recipe.ingredients.length;
  if (/lasagna|moussaka|biryani|paella|dumpling|lechon|relleno/i.test(recipe.name)) return "25–35 min";
  if (ingredientCount >= 8) return "20 min";
  if (ingredientCount >= 6) return "15 min";
  return "10 min";
}

function difficultyFor(recipe: Recipe): RecipeDetails["difficulty"] {
  if (/lechon|relleno|paella|biryani|lasagna|moussaka|dumpling|embutido|morcon/i.test(recipe.name)) return "Advanced";
  if (/stew|curry|adobo|sinigang|kare-kare|tagine|risotto|goulash|pho|wat|feijoada/i.test(`${recipe.name} ${recipe.description}`)) return "Moderate";
  return "Easy";
}

function equipmentFor(recipe: Recipe) {
  const text = `${recipe.name} ${recipe.instructions.join(" ")}`.toLowerCase();
  const equipment = new Set<string>(["Chef’s knife", "Cutting board", "Measuring cups and spoons"]);
  if (/bake|roast|pizza|lasagna|moussaka|pie/.test(text)) equipment.add("Oven and baking dish or sheet");
  if (/fry|stir-fry|sear|brown|omelet|omelette|tortilla/.test(text)) equipment.add("Large skillet or wok");
  if (/simmer|boil|soup|stew|curry|braise|rice/.test(text)) equipment.add("Heavy pot with lid");
  if (/blend|purée|puree/.test(text)) equipment.add("Blender or food processor");
  if (/grill|skewer/.test(text)) equipment.add("Grill or grill pan");
  equipment.add("Instant-read thermometer");
  return [...equipment];
}

function safetyFor(recipe: Recipe) {
  const text = recipe.ingredients.filter((item) => !/fish sauce|oyster sauce/i.test(item)).join(" ").toLowerCase();
  if (/chicken|poultry/.test(text)) return "Cook poultry to 74°C / 165°F at the thickest point, away from bone.";
  if (/ground beef|ground pork|ground lamb|ground meat/.test(text)) return "Cook ground meat to 71°C / 160°F throughout.";
  if (/fish|shrimp|prawn|mussels|squid|crab|seafood/.test(text)) return "Cook seafood to 63°C / 145°F; discard shellfish that remain closed after cooking.";
  if (/beef|pork|lamb/.test(text)) return "Cook whole cuts to at least 63°C / 145°F, then rest for 3 minutes; braised cuts should be fork-tender.";
  if (/egg/.test(text)) return "For higher-risk diners, cook eggs until both white and yolk are firm, or use pasteurized eggs.";
  return null;
}

function techniqueDetail(step: string) {
  const lower = step.toLowerCase();
  if (/brown|sear/.test(lower)) return `${step} Use medium-high heat and work in batches so the food sizzles rather than steams; leave each side undisturbed for 2–3 minutes before turning.`;
  if (/sauté|saute|soften/.test(lower)) return `${step} Cook over medium heat for 4–6 minutes, stirring every 30 seconds, until the aromatics are translucent and fragrant but not scorched.`;
  if (/stir-fry/.test(lower)) return `${step} Keep the pan over high heat and toss continuously for 2–4 minutes so the ingredients stay crisp and cook evenly.`;
  if (/simmer|braise/.test(lower)) return `${step} Bring the liquid just to a boil, immediately reduce to low, and maintain only small, lazy bubbles; stir and check the liquid level every 10 minutes.`;
  if (/boil.*pasta|boil.*noodle/.test(lower)) return `${step} Use generously salted water and stir during the first minute; begin checking 2 minutes before the package time and drain when tender with a slight bite.`;
  if (/bake|roast/.test(lower)) return `${step} Preheat the oven fully before the food goes in, rotate the pan halfway through, and use the visual and temperature cues in the next step rather than relying on time alone.`;
  if (/fry/.test(lower)) return `${step} Keep the oil near 175°C / 350°F, avoid crowding, and let the oil recover between batches; drain on a rack so the crust stays crisp.`;
  if (/mix|combine|whisk/.test(lower)) return `${step} Scrape the bottom and sides of the bowl and stop as soon as the mixture is uniform to avoid unnecessary overmixing.`;
  if (/add|stir|toss|fold/.test(lower)) return `${step} Add the ingredients in the stated order, stirring after each addition so seasonings disperse evenly and nothing catches on the bottom.`;
  return `${step} Keep the heat controlled, observe the texture and aroma, and adjust the timing slightly for your cookware and ingredient size.`;
}

function finishingCue(recipe: Recipe) {
  const text = `${recipe.name} ${recipe.description}`.toLowerCase();
  if (/soup|stew|curry|adobo|sinigang|braise|tagine|wat|goulash|feijoada/.test(text)) return "Check the final consistency: the solids should be tender and the sauce or broth should lightly coat a spoon. Simmer uncovered to thicken, or add hot water a tablespoon at a time to loosen.";
  if (/fried|fry|schnitzel|falafel/.test(text)) return "Check that the exterior is evenly golden and crisp without dark or bitter patches. Transfer to a rack, not directly to a flat plate, for 3–5 minutes.";
  if (/rice|biryani|paella|risotto/.test(text)) return "Taste several grains from different parts of the pan. The rice should be fully cooked but distinct; rest it covered for 5–10 minutes unless the dish is meant to be served immediately.";
  if (/pasta|spaghetti|noodle|yakisoba|pad thai/.test(text)) return "Taste a noodle and check the sauce adhesion. Add reserved cooking liquid one tablespoon at a time until the sauce clings without pooling.";
  return "Check texture at the center of the largest piece and confirm the food is evenly cooked. Correct moisture with a small splash of hot water or a brief uncovered reduction.";
}

export function getRecipeDetails(recipe: Recipe): RecipeDetails {
  const safetyNote = safetyFor(recipe);
  const ingredients = recipe.ingredients.map((item) => ({ item, amount: amountFor(item), preparation: prepFor(item) }));
  const steps = [
    `Read the complete recipe once. Set out ${equipmentFor(recipe).slice(0, 3).join(", ").toLowerCase()}, and allow about ${prepMinutes(recipe)} for preparation before cooking.`,
    `Measure every ingredient for 4 servings. Wash and dry produce, cut similar ingredients to an even size, and keep garnishes separate from ingredients that will be cooked.`,
    safetyNote ? `Set up safely: keep raw protein, its board, and utensils separate from ready-to-eat ingredients. Wash hands with soap after handling it; do not rinse raw poultry.` : "Set up a clean work area and place ingredients in the order they will be used so no step is rushed.",
    ...recipe.instructions.map(techniqueDetail),
    finishingCue(recipe),
    safetyNote ? `Verify doneness with a clean thermometer: ${safetyNote} Check more than one piece when sizes vary.` : "Taste a fully cooked component. Adjust salt first, then balance richness with a few drops of acid or sharpness with a small pinch of sugar if needed.",
    "Turn off the heat and make the final seasoning adjustment while the food is still hot. Add delicate herbs, citrus, crisp toppings, or finishing oil only now so their aroma and texture stay fresh.",
    `Serve promptly in warmed or room-temperature dishes as appropriate. Cool leftovers in shallow containers and refrigerate within 2 hours; reheat only the portion needed until steaming hot.`,
  ];

  return {
    servings: 4,
    prepTime: prepMinutes(recipe),
    difficulty: difficultyFor(recipe),
    equipment: equipmentFor(recipe),
    ingredients,
    steps,
    safetyNote,
    cookNote: "Quantities are a practical four-serving starting point. Taste and adjust salt, heat, acidity, and liquid for your ingredients and regional or family style.",
  };
}
