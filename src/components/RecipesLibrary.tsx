"use client";

import { useDrag } from "react-dnd";
import { type Meal } from "@/types/meal";
import { useState, useMemo } from "react";
import { getSortedRecipeSearchResults, getRecipeUsage, getTimeColor, formatTime } from "./utils";

const ItemTypes = {
  RECIPE: "recipe",
};

const MAX_DISPLAYED_RECIPES = 6;

const RecipeCard = ({ meal, usageCount = 0 }: { meal: Meal; usageCount?: number }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.RECIPE,
    item: () => meal,
    collect: (monitor: { isDragging: () => boolean }) => ({
      isDragging: monitor.isDragging(),
    }),
  }));


  return (
    <div
      ref={(node) => {
        if (node) drag(node);
      }}
      className={`p-3 mb-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-md cursor-move border border-purple-200 hover:shadow-lg transition-all duration-200 ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="h-full flex flex-col justify-between">
        <div>
          <div className="font-semibold text-gray-800 capitalize leading-tight">{meal.name}</div>
          {meal.tags && meal.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1 mb-2">
              {meal.tags.map((tag, index) => (
                <span key={index} className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          {meal.name && meal.time && meal.time.trim() !== '' && (
            <span className={`text-xs px-2 py-1 rounded-full w-fit ${getTimeColor(meal.time)}`}>
              {formatTime(meal.time)}
            </span>
          )}
          {usageCount > 0 && (
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded-full">
              Made {usageCount}x
            </span>
          )}
        </div>
      </div>

    </div>
  );
};

interface RecipesLibraryProps {
  recipes: Meal[];
  planner?: Record<string, Record<string, Meal | string> & { notes?: string }>;
}

const RecipesLibrary = ({ recipes, planner = {} }: RecipesLibraryProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Get all unique tags from recipes
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    recipes.forEach(recipe => {
      if (recipe.tags) {
        recipe.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [recipes]);

  // Filter recipes based on search term and selected tags
  const filteredRecipes = useMemo(() => {
    return getSortedRecipeSearchResults(recipes, searchTerm, planner);
  }, [recipes, searchTerm, planner]);

  // Show only first 3 recipes unless showAll is true or filters are active
  const displayedRecipes = useMemo(() => {
    const hasActiveFilters = searchTerm !== "" || selectedTags.length > 0;
    if (showAll || hasActiveFilters) {
      return filteredRecipes;
    }
    return filteredRecipes.slice(0, MAX_DISPLAYED_RECIPES);
  }, [filteredRecipes, showAll, searchTerm, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleShowMore = () => {
    setShowAll(true);
  };

  const handleShowLess = () => {
    setShowAll(false);
  };

  return (
    <div className="w-full">      
      {/* Search and Filters Section */}
      <div>
        {/* Search Section */}
        <div>
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent bg-white/90"
          />
        </div>

        {/* Tags Filter Section */}
        {allTags.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Filter by tags:</h3>
            <div className="flex flex-wrap gap-1">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-2 py-1 rounded-full transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                      : "bg-white text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="text-xs text-purple-600 hover:text-purple-800 mt-2"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="text-xs text-gray-500 my-4">
        {displayedRecipes.length} of {filteredRecipes.length} recipes
        {filteredRecipes.length !== recipes.length && ` (${recipes.length} total)`}
      </div>

      {/* Recipes List - Horizontal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {displayedRecipes.length > 0 ? (
          displayedRecipes.map((meal: Meal) => (
            <RecipeCard meal={meal} key={meal.name.replace(/\s+/g, "-")} usageCount={getRecipeUsage(meal.name, planner)} />
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 py-8">
            <p>No recipes found</p>
            <p className="text-xs mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Show More/Show Less Button */}
      {filteredRecipes.length > MAX_DISPLAYED_RECIPES && !searchTerm && selectedTags.length === 0 && (
        <div className="text-center">
          {showAll ? (
            <button
              onClick={handleShowLess}
              className="text-xs text-purple-600 hover:text-purple-800"
            >
              Show Less
            </button>
          ) : (
            <button
              onClick={handleShowMore}
              className="text-xs text-purple-600 hover:text-purple-800"
            >
              Show More ({filteredRecipes.length - MAX_DISPLAYED_RECIPES} more)
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RecipesLibrary;
export { ItemTypes }; 