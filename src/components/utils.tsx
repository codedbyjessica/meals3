import { Meal, Planner } from "@/types/meal";



export const getRecipeUsage = (recipeName: string, planner: Planner) => {
  let count = 0;
  Object.values(planner).forEach((day: Record<string, Meal | string> & { notes?: string }) => {
    Object.values(day).forEach((meal: Meal | string) => {
      if (meal && typeof meal === 'object' && 'name' in meal && meal.name === recipeName) {
        count++;
      }
    });
  });
  return count;
};


export const getSortedRecipeSearchResults = (recipes: Meal[], searchValue: string, planner: Planner) => {
  const unsortedSearchResults = searchValue && searchValue.trim() !== "" ? getRecipeSearchResults(recipes, searchValue) : recipes;

  // Sort by usage (most used first), then by time (longest first)
  return unsortedSearchResults.sort((a: Meal, b: Meal) => {
    const usageA = getRecipeUsage(a.name, planner);
    const usageB = getRecipeUsage(b.name, planner);
    
    // First sort by usage (descending)
    if (usageA !== usageB) {
      return usageB - usageA;
    }
    
    // If usage is the same, sort by name (ascending)
    return a.name.localeCompare(b.name);
  });
}

const getRecipeSearchResults = (recipes: Meal[], searchValue: string ) => recipes.filter(recipe => {
  const searchTerm = searchValue.toLowerCase();
  
  // Search by name
  const nameMatch = recipe.name.toLowerCase().includes(searchTerm);
  
  // Search by tags
  const tagMatch = recipe.tags && recipe.tags.some(tag => 
    tag.toLowerCase().includes(searchTerm)
  );
  
  return nameMatch || tagMatch;
})

export const getTimeColor = (time: string) => {
  const hours = parseFloat(time);
  if (hours <= 0.5) {
    return "text-green-600 bg-green-100";
  } else if (hours <= 1) {
    return "text-yellow-600 bg-yellow-100";
  } else {
    return "text-red-600 bg-red-100";
  }
}

export const formatTime = (time: string) => {
  const hours = parseFloat(time);
  if (hours < 1) {
    return `${hours * 60} min`;
  } else {
    return `${hours} hours`;
  }
}