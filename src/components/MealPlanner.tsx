"use client";

import React, { useState } from "react";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { createPortal } from "react-dom";
import RecipesLibrary, { ItemTypes } from "@/components/RecipesLibrary";
import { useSupabase } from "@/hooks/useSupabase";
import { type Meal, type Planner } from "@/types/meal";
import { getSortedRecipeSearchResults, getTimeColor, formatTime } from "@/components/utils";
import Loading from "@/components/Loading";

const meals = ["Lunch", "Dinner"];

// Helper function to get the start of the week (Sunday)
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Adjust to start on Sunday (day 0)
  return new Date(d.setDate(diff));
};

// Helper function to format date for display
const formatDate = (date: Date) => {
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
    date: date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  };
};

// Helper function to format date for Supabase key
const formatDateKey = (date: Date) => {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
};

// Helper function to get dates for the week
const getWeekDates = (startDate: Date) => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const initialPlanner: Planner = {};

function DropCell({
  onDropSample,
  children,
  mealColor = "",
}: {
  onDropSample: (meal: Meal) => void;
  children: React.ReactNode;
  mealColor?: string;
}) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.RECIPE,
    drop: (item: Meal) => {
      onDropSample(item);
    },
    collect: (monitor: { isOver: () => boolean; canDrop: () => boolean }) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));
  return (
    <div
      ref={(node) => {
        if (node) drop(node);
      }}
      className={`overflow-auto col-span-5 p-3 border border-purple-200 transition-colors ${mealColor ? mealColor : 'bg-white/90'} ${
        isOver && canDrop ? "bg-gradient-to-r from-pink-100 to-purple-100" : ""
      }`}
    >
      {children}
    </div>
  );
}

export default function MealPlanner() {
  const { planner, recipes, loading, error, savePlanner, updateMeal } = useSupabase();
  const [editing, setEditing] = useState<{ date: string; meal: string } | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState<string>("");
  const [showIngredients, setShowIngredients] = useState<{ date: string; meal: string } | null>(null);
  const [mealInput, setMealInput] = useState<{ date: string; meal: string; value: string } | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ x: number; y: number; width: number } | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [form, setForm] = useState<Meal>({ name: "", ingredients: [], aromatics: [], condiments: [], time: "", instructions: "", tags: [] });
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getStartOfWeek(new Date()));


  // Get dates for current week
  const weekDates = getWeekDates(currentWeekStart);

  // Initialize planner with Supabase data or default structure
  const currentPlanner = Object.keys(planner).length > 0 ? planner : initialPlanner;

  // Filter recipes based on input value
  const getFilteredRecipes = (inputValue: string) => {
    return getSortedRecipeSearchResults(recipes, inputValue, currentPlanner);
  };

  const handleEdit = (date: string, meal: string) => {
    setEditing({ date, meal });
    const mealData = currentPlanner[date]?.[meal];
    setForm(isMealObject(mealData) ? mealData : { name: "", ingredients: [], aromatics: [], condiments: [], time: "", instructions: "", tags: [] });
  };

  const handleSave = async () => {
    if (editing) {
      const updatedPlanner = {
        ...currentPlanner,
        [editing.date]: {
          ...currentPlanner[editing.date],
          [editing.meal]: { ...form },
        },
      };
      await savePlanner(updatedPlanner);
      setEditing(null);
      setForm({ name: "", ingredients: [], aromatics: [], condiments: [], time: "", instructions: "", tags: [] });
    }
  };

  const handleShowDetails = (date: string, meal: string) => {
    setShowIngredients(
      showIngredients && showIngredients.date === date && showIngredients.meal === meal
        ? null
        : { date, meal }
    );
  };

  const handleDropSample = async (date: string, mealType: string, sample: Meal) => {
    await updateMeal(date, mealType, sample);
    setEditing(null);
    setShowIngredients(null);
  };

  const handleRemove = async (date: string, mealType: string) => {
    const updatedPlanner = { ...currentPlanner };
    if (updatedPlanner[date]) {
      delete updatedPlanner[date][mealType];
      // Remove the date entry if it's empty
      if (Object.keys(updatedPlanner[date]).length === 0) {
        delete updatedPlanner[date];
      }
    }
    await savePlanner(updatedPlanner);
    setEditing(null);
    setShowIngredients(null);
  };

  const handleStartNotesEdit = (date: string) => {
    setEditingNotes(date);
    setNotesInput(currentPlanner[date]?.notes || "");
  };

  const handleSaveNotes = async (date: string) => {
    const updatedPlanner = {
      ...currentPlanner,
      [date]: {
        ...currentPlanner[date],
        notes: notesInput,
      },
    };
    await savePlanner(updatedPlanner);
    setEditingNotes(null);
    setNotesInput("");
  };

  const handleCancelNotesEdit = () => {
    setEditingNotes(null);
    setNotesInput("");
  };

  const handleMealInputChange = (value: string) => {
    console.log('Meal input changed:', value);
    if (mealInput) {
      setMealInput({ ...mealInput, value });
    }
  };

  const handleMealInputSubmit = async (date: string, mealType: string, value: string) => {
    if (!value.trim()) {
      setMealInput(null);
      return;
    }

    // First, try to find an existing recipe
    const existingRecipe = recipes.find(recipe => 
      recipe.name.toLowerCase() === value.toLowerCase().trim()
    );

    if (existingRecipe) {
      // Use existing recipe
      await handleDropSample(date, mealType, existingRecipe);
    } else {
      // Create custom meal
      const customMeal: Meal = {
        name: value.trim(),
        ingredients: [],
        aromatics: [],
        condiments: [],
        time: "",
        instructions: "",
        tags: []
      };
      await handleDropSample(date, mealType, customMeal);
    }
    
    setMealInput(null);
  };

  const handleRecipeSelect = async (date: string, mealType: string, recipe: Meal) => {
    await handleDropSample(date, mealType, recipe);
    setMealInput(null);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newStart = new Date(currentWeekStart);
    if (direction === 'prev') {
      newStart.setDate(newStart.getDate() - 7);
    } else {
      newStart.setDate(newStart.getDate() + 7);
    }
    setCurrentWeekStart(newStart);
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getStartOfWeek(new Date()));
  };

  // Combine ingredients, aromatics, and condiments into one display string
  const getAllIngredients = (meal: Meal) => {
    const allItems = [
      ...(meal.ingredients || []),
      ...(meal.aromatics || []),
      ...(meal.condiments || [])
    ].filter(item => item && item.trim() !== '');
    return allItems.join(', ');
  };

  // Detect repeated meals and assign rainbow colors
  const getMealColors = () => {
    const mealColors: { [key: string]: string } = {};
    const mealCounts: { [key: string]: number } = {};
    const rainbowColors = [
      'bg-pink-50 border-pink-200',    // Pastel Pink
      'bg-purple-50 border-purple-200', // Pastel Purple
      'bg-blue-50 border-blue-200',   // Pastel Blue
      'bg-yellow-50 border-yellow-200', // Pastel Yellow
      'bg-rose-50 border-rose-200',   // Pastel Rose
      'bg-violet-50 border-violet-200', // Pastel Violet
      'bg-indigo-50 border-indigo-200', // Pastel Indigo
    ];

    // Count occurrences of each meal
    weekDates.forEach(date => {
      const dateKey = formatDateKey(date);
      meals.forEach(mealType => {
        const meal = currentPlanner[dateKey]?.[mealType];
        if (meal && typeof meal === 'object' && 'name' in meal && meal.name) {
          mealCounts[meal.name] = (mealCounts[meal.name] || 0) + 1;
        }
      });
    });

    // Assign colors to repeated meals
    let colorIndex = 0;
    Object.entries(mealCounts).forEach(([mealName, count]) => {
      if (count > 1) {
        mealColors[mealName] = rainbowColors[colorIndex % rainbowColors.length];
        colorIndex++;
      }
    });

    return mealColors;
  };

  const mealColors = getMealColors();

  // Helper function to check if a meal has any details
  const hasMealDetails = (meal: Meal) => {
    return (
      (meal.ingredients && meal.ingredients.length > 0) ||
      (meal.instructions && meal.instructions.trim() !== '') ||
      (meal.tags && meal.tags.length > 0) ||
      (meal.time && meal.time.trim() !== '') ||
      (meal.aromatics && meal.aromatics.length > 0) ||
      (meal.condiments && meal.condiments.length > 0)
    );
  };

  // Helper function to check if a meal is a Meal object
  const isMealObject = (meal: unknown): meal is Meal => {
    return meal !== null && typeof meal === 'object' && 'name' in meal;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>

      {loading && <Loading floating />}

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex flex-col items-center py-10 gap-8 w-full">
        {/* Sample Meals Section - Now at the top */}
        <div className="w-full max-w-6xl">
          <RecipesLibrary recipes={recipes} planner={currentPlanner} />
        </div>
        
        {/* Main Grid */}
        <div className="w-full max-w-6xl">
          <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl overflow-hidden border border-purple-200">
            {/* Week Navigation */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 border-b border-purple-200">
              <button
                onClick={() => navigateWeek('prev')}
                className="px-3 py-1 text-purple-600 hover:text-purple-800 hover:bg-purple-200 rounded transition-colors"
              >
                ← Previous Week
              </button>
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {formatDate(weekDates[0]).date} - {formatDate(weekDates[6]).date}
                </h2>
                <button
                  onClick={goToCurrentWeek}
                  className="px-3 py-1 text-sm bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-md"
                >
                  Go to today
                </button>
              </div>
              <button
                onClick={() => navigateWeek('next')}
                className="px-3 py-1 text-purple-600 hover:text-purple-800 hover:bg-purple-200 rounded transition-colors"
              >
                Next Week →
              </button>
            </div>
            {/* Header */}
            <div className="grid grid-cols-14 gap-0 border-b border-purple-200">
              <div className="col-span-2 p-3 font-semibold bg-gradient-to-r from-pink-100 to-purple-100 text-gray-800">Date</div>
              {meals.map((meal) => (
                <div key={meal} className="col-span-5 p-3 font-semibold bg-gradient-to-r from-pink-100 to-purple-100 text-gray-800 border-l border-purple-200">
                  {meal}
                </div>
              ))}
              <div className="col-span-2 p-3 font-semibold bg-gradient-to-r from-pink-100 to-purple-100 text-gray-800 border-l border-purple-200">Notes</div>
            </div>
            {/* Grid Body */}
            <div className="space-y-0">
              {weekDates.map((date) => {
                const dateKey = formatDateKey(date);
                const isToday = dateKey === formatDateKey(new Date());
                return (
                  <div key={dateKey} className="grid grid-cols-14 gap-0">
                    <div className={`relative col-span-2 p-3 font-semibold text-gray-700 border-b border-purple-200 ${
                      isToday ? 'bg-gradient-to-r from-pink-100 to-blue-100 border-pink-300' : 'bg-gradient-to-r from-pink-50 to-purple-50'
                    }`}>
                      <div className="text-sm font-bold">{formatDate(date).weekday}</div>
                      <div className="text-xs text-gray-500">{formatDate(date).date}</div>
                      {isToday && <div className="text-xs text-purple-600 font-medium absolute right-3 top-4">Today</div>}
                    </div>
                    {meals.map((mealType) => (
                      <DropCell
                        key={mealType}
                        onDropSample={(sample) => handleDropSample(dateKey, mealType, sample)}
                        mealColor={isMealObject(currentPlanner[dateKey]?.[mealType]) ? mealColors[currentPlanner[dateKey][mealType].name] || "" : ""}
                      >
                        {editing && editing.date === dateKey && editing.meal === mealType ? (
                          <div className="space-y-2">
                            <input
                              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                              placeholder="Meal Name"
                              value={form.name}
                              onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                            <textarea
                              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                              placeholder="Ingredients (comma separated)"
                              value={form.ingredients.join(', ')}
                              onChange={(e) => setForm({ ...form, ingredients: e.target.value.split(',').map(item => item.trim()).filter(item => item !== '') })}
                            />
                            <textarea
                              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                              placeholder="Instructions"
                              value={form.instructions}
                              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                            />
                            <input
                              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                              placeholder="Tags (comma separated)"
                              value={form.tags?.join(', ') || ''}
                              onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '') })}
                            />
                            <input
                              type="number"
                              step="0.25"
                              min="0"
                              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                              placeholder="Time required (hours)"
                              value={form.time}
                              onChange={(e) => setForm({ ...form, time: e.target.value })}
                            />
                            <div className="flex gap-2">
                              <button
                                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-md"
                                onClick={handleSave}
                              >
                                Save
                              </button>
                              <button
                                className="bg-gradient-to-r from-pink-100 to-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:from-pink-200 hover:to-purple-200 transition-all duration-200"
                                onClick={() => setEditing(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                
                                  {/* custom meals */}
                                  {isMealObject(currentPlanner[dateKey]?.[mealType]) && currentPlanner[dateKey]?.[mealType]?.name && (!currentPlanner[dateKey]?.[mealType]?.tags || currentPlanner[dateKey]?.[mealType]?.tags?.length === 0) && 
                                    <span className={`font-medium text-gray-800 capitalize`}>{currentPlanner[dateKey]?.[mealType]?.name}</span>
                                  }

                                {isMealObject(currentPlanner[dateKey]?.[mealType]) && hasMealDetails(currentPlanner[dateKey][mealType] as Meal) && (
                                  <button
                                    onClick={() => handleShowDetails(dateKey, mealType)}
                                    className="text-gray-800 hover:text-blue-800 transition-colors cursor-pointer flex items-center gap-1"
                                    title="Toggle details"
                                  >
                                    <div className="text-gray-800 capitalize">{currentPlanner[dateKey]?.[mealType]?.name}</div>
                                    <div className="text-blue-600">{showIngredients && showIngredients.date === dateKey && showIngredients.meal === mealType ? "−" : "+"}</div>
                                  </button>
                                )}
                              </div>
                              {isMealObject(currentPlanner[dateKey]?.[mealType]) && currentPlanner[dateKey]?.[mealType]?.name && (
                                <button
                                  onClick={() => handleRemove(dateKey, mealType)}
                                  className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                  title="Remove meal"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                            {!isMealObject(currentPlanner[dateKey]?.[mealType]) && (
                              <div className="mt-2 relative z-10">
                                <input
                                  type="text"
                                  placeholder="Search existing meal or type new meal name..."
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-300 focus:border-purple-300"
                                  value={mealInput && mealInput.date === dateKey && mealInput.meal === mealType ? mealInput.value : ""}
                                  data-meal-input={`${dateKey}-${mealType}`}
                                  onChange={(e) => {
                                    if (!mealInput || mealInput.date !== dateKey || mealInput.meal !== mealType) {
                                      setMealInput({ date: dateKey, meal: mealType, value: e.target.value });
                                      // Calculate position after a brief delay to ensure DOM is updated
                                      setTimeout(() => {
                                        const inputElement = document.querySelector(`[data-meal-input="${dateKey}-${mealType}"]`) as HTMLElement;
                                        if (inputElement) {
                                          const rect = inputElement.getBoundingClientRect();
                                          setDropdownPosition({
                                            x: rect.left,
                                            y: rect.bottom + 4,
                                            width: rect.width
                                          });
                                        }
                                      }, 10);
                                    } else {
                                      handleMealInputChange(e.target.value);
                                    }
                                  }}
                                  onFocus={() => {
                                    if (!mealInput || mealInput.date !== dateKey || mealInput.meal !== mealType) {
                                      setMealInput({ date: dateKey, meal: mealType, value: "" });
                                    }
                                    setIsInputFocused(true);
                                    // Calculate position
                                    setTimeout(() => {
                                      const inputElement = document.querySelector(`[data-meal-input="${dateKey}-${mealType}"]`) as HTMLElement;
                                      if (inputElement) {
                                        const rect = inputElement.getBoundingClientRect();
                                        setDropdownPosition({
                                          x: rect.left,
                                          y: rect.bottom + 4,
                                          width: rect.width
                                        });
                                      }
                                    }, 10);
                                  }}
                                  onBlur={(e) => {
                                    // Delay to allow clicking on suggestions
                                    setTimeout(() => {
                                      setIsInputFocused(false);
                                      if (e.currentTarget && e.currentTarget.value.trim()) {
                                        handleMealInputSubmit(dateKey, mealType, e.currentTarget.value.trim());
                                      }
                                      setMealInput(null);
                                      setDropdownPosition(null);
                                    }, 150);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                      handleMealInputSubmit(dateKey, mealType, e.currentTarget.value.trim());
                                    } else if (e.key === 'Escape') {
                                      setIsInputFocused(false);
                                      setMealInput(null);
                                      setDropdownPosition(null);
                                      e.currentTarget.value = "";
                                    }
                                  }}
                                />
                              </div>
                            )}
                            {isMealObject(currentPlanner[dateKey]?.[mealType]) && currentPlanner[dateKey]?.[mealType]?.time && currentPlanner[dateKey]?.[mealType]?.time.trim() !== '' && (
                              <div className="mt-1">
                                <span className={`text-xs px-2 py-1 rounded-full ${getTimeColor(currentPlanner[dateKey][mealType].time)}`}>
                                  {formatTime(currentPlanner[dateKey][mealType].time)}
                                </span>
                              </div>
                            )}
                            {showIngredients && showIngredients.date === dateKey && showIngredients.meal === mealType && (
                              <div className="mt-2 p-3 bg-gray-50 rounded-lg shadow-sm border border-gray-200 text-sm">
                                <div className="font-semibold mb-1 text-gray-700">Ingredients:</div>
                                <div className="whitespace-pre-line mb-2 text-gray-700">
                                  {isMealObject(currentPlanner[dateKey][mealType]) && getAllIngredients(currentPlanner[dateKey][mealType] as Meal).split(',').map((item, index) => (
                                    <div key={index}>- {item.trim()}</div>
                                  ))}
                                </div>
                                {isMealObject(currentPlanner[dateKey][mealType]) && (currentPlanner[dateKey][mealType] as Meal).instructions && (
                                  <div className="mb-2">
                                    <div className="font-semibold mb-1 text-gray-700">Instructions:</div>
                                    <div className="whitespace-pre-line text-gray-700 italic">{(currentPlanner[dateKey][mealType] as Meal).instructions}</div>
                                  </div>
                                )}
                                {isMealObject(currentPlanner[dateKey][mealType]) && (currentPlanner[dateKey][mealType] as Meal).tags && (currentPlanner[dateKey][mealType] as Meal).tags!.length > 0 && (
                                  <div className="mb-2">
                                    <div className="font-semibold mb-1 text-gray-700">Tags:</div>
                                    <div className="flex flex-wrap gap-1">
                                      {(currentPlanner[dateKey][mealType] as Meal).tags!.map((tag: string, index: number) => (
                                        <span key={index} className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {isMealObject(currentPlanner[dateKey]?.[mealType]) && currentPlanner[dateKey]?.[mealType]?.time && currentPlanner[dateKey]?.[mealType]?.time.trim() !== '' && (
                                  <div className="mb-2">
                                    <div className="font-semibold mb-1 text-gray-700">Time Required:</div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${getTimeColor(currentPlanner[dateKey][mealType].time)}`}>
                                      {formatTime(currentPlanner[dateKey][mealType].time)}
                                    </span>
                                  </div>
                                )}
                                <button
                                  className="mt-2 text-xs text-blue-600 underline hover:text-blue-800"
                                  onClick={() => handleEdit(dateKey, mealType)}
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </DropCell>
                    ))}
                    {/* Notes Column */}
                    <div className="col-span-2 p-3 border-b border-gray-200 bg-white">
                      {editingNotes === dateKey ? (
                        <div className="h-full flex flex-col">
                          <textarea
                            className="flex-1 resize-none border border-purple-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-300 text-xs"
                            placeholder="Add notes..."
                            value={notesInput}
                            onChange={(e) => setNotesInput(e.target.value)}
                            onBlur={() => handleSaveNotes(dateKey)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.ctrlKey) {
                                handleSaveNotes(dateKey);
                              } else if (e.key === 'Escape') {
                                handleCancelNotesEdit();
                              }
                            }}
                            autoFocus
                          />
                          <div className="flex gap-1 mt-1 text-[8px] text-gray-500">
                            <span>Ctrl+Enter - save</span>
                            <span>•</span>
                            <span>Esc - cancel</span>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="h-full cursor-pointer hover:bg-gray-50 rounded p-1 transition-colors"
                          onClick={() => handleStartNotesEdit(dateKey)}
                        >
                          {currentPlanner[dateKey]?.notes ? (
                            <div className="text-xs text-gray-700 whitespace-pre-line">
                              {currentPlanner[dateKey].notes}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 italic">
                              Click to add notes...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Dropdown Portal */}
      {mealInput && dropdownPosition && isInputFocused && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed bg-white border-2 border-purple-300 rounded-lg shadow-xl z-[9999] max-h-48 overflow-y-auto"
          style={{
            left: dropdownPosition.x,
            top: dropdownPosition.y,
            width: dropdownPosition.width,
            minHeight: '40px'
          }}
        >
          {getFilteredRecipes(mealInput.value).length > 0 ? (
            <>
              {getFilteredRecipes(mealInput.value).map((recipe: Meal ) => (
                <button
                  key={recipe.name}
                  onClick={() => handleRecipeSelect(mealInput.date, mealInput.meal, recipe)}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-purple-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{recipe.name}</div>
                      {recipe.tags && recipe.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {recipe.tags.map((tag: string, index: number) => (
                            <span key={index} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {recipe.time && recipe.time.trim() !== '' && (
                      <span className="text-gray-500 text-xs ml-2 flex-shrink-0">
                        {recipe.time.toLowerCase() === 'forever' ? 'forever' : 
                         parseFloat(recipe.time) < 1 ? 
                           `${Math.round(parseFloat(recipe.time) * 60)} min` : 
                           `${recipe.time} hours`}
                      </span>
                    )}
                  </div>
                </button>
              ))}
              <div className="px-3 py-1 text-xs text-gray-400 border-t border-gray-100">
                {getFilteredRecipes(mealInput.value).length} recipe{getFilteredRecipes(mealInput.value).length !== 1 ? 's' : ''} found
              </div>
            </>
          ) : mealInput.value.trim() ? (
            <div className="px-3 py-2 text-xs text-gray-500">
              No recipes found. Press Enter to create custom meal.
            </div>
          ) : (
            <div className="px-3 py-2 text-xs text-gray-500">
              Type to search recipes...
            </div>
          )}
        </div>,
        document.body
      )}
    </DndProvider>
  );
} 