"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { type Meal } from '@/types/meal';
import { useSupabase } from '@/hooks/useSupabase';
import ConfirmModal from './ConfirmModal';
import Modal from './Modal';
import Loading from './Loading';

export default function RecipeManager() {
  const { recipes, loading, error, loadRecipes } = useSupabase();
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Meal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; recipe: Meal | null }>({ show: false, recipe: null });

  // Form state
  const [formData, setFormData] = useState<Meal>({
    name: '',
    ingredients: [],
    aromatics: [],
    condiments: [],
    time: '',
    instructions: '',
    tags: []
  });

  // Get current user
  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  };

  // Save recipe
  const saveRecipe = async (recipe: Meal) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const recipeData = {
        ...recipe,
        user_id: user.id,
        updated_at: new Date().toISOString()
      };

      if (editingRecipe) {
        // Update existing recipe
        const { error } = await supabase
          .from('recipe')
          .update(recipeData)
          .eq('id', editingRecipe.id)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        // Create new recipe
        const { error } = await supabase
          .from('recipe')
          .insert(recipeData);
        
        if (error) throw error;
      }

      await loadRecipes();
      setShowForm(false);
      setEditingRecipe(null);
      resetForm();
    } catch (err) {
      console.error('Error saving recipe:', err);
    }
  };

  // Delete recipe
  const deleteRecipe = async (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
      setDeleteModal({ show: true, recipe });
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleteModal.recipe) return;

    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('recipe')
        .delete()
        .eq('id', deleteModal.recipe.id!)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      await loadRecipes();
      setDeleteModal({ show: false, recipe: null });
    } catch (err) {
      console.error('Error deleting recipe:', err);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteModal({ show: false, recipe: null });
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      ingredients: [],
      aromatics: [],
      condiments: [],
      time: '',
      instructions: '',
      tags: []
    });
  };

  // Edit recipe
  const editRecipe = (recipe: Meal) => {
    setEditingRecipe(recipe);
    setFormData(recipe);
    setShowForm(true);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const processedData = processArrayFields(formData);
    saveRecipe(processedData);
  };

  // Handle array field changes
  const handleArrayFieldChange = (field: keyof Meal, value: string) => {
    // Store the raw input value, don't process it immediately
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Process array fields when form is submitted
  const processArrayFields = (data: Meal) => {
    const processed = { ...data };
    const arrayFields: (keyof Meal)[] = ['ingredients', 'aromatics', 'condiments', 'tags'];
    
    arrayFields.forEach(field => {
      const value = processed[field];
      if (typeof value === 'string') {
        (processed as Record<string, unknown>)[field] = value.split(',').map(item => item.trim()).filter(item => item !== '');
      }
    });
    return processed as Meal;
  };

  // Helper function to get display value for array fields
  const getArrayFieldValue = (field: keyof Meal) => {
    const value = formData[field];
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value || '';
  };

  // Get all unique tags
  const getAllTags = () => {
    const tags = new Set<string>();
    recipes.forEach(recipe => {
      recipe.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  };

  // Filter recipes
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.ingredients.some(ing => ing.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTag = selectedTag === 'all' || recipe.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  // Load recipes on mount
  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);


  return (
    <div className="space-y-6">

      {loading && <Loading message="Loading recipes..." size="md" />}
      {/* Header with search and filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-md"
          >
            Add Recipe
          </button>
        </div>
        
        {/* Tags filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedTag === 'all'
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Tags
          </button>
          {getAllTags().map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? 'all' : tag)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedTag === tag
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Recipe form */}
      <Modal 
        isOpen={showForm} 
        onClose={() => {
          setShowForm(false);
          setEditingRecipe(null);
          resetForm();
        }}
        title={editingRecipe ? 'Edit Recipe' : 'Add New Recipe'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="flex gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipe Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter recipe name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cooking Time (hours)
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., 1.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ingredients (comma separated)
            </label>
            <input
              type="text"
              value={getArrayFieldValue('ingredients')}
              onChange={(e) => handleArrayFieldChange('ingredients', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., chicken, rice, vegetables"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aromatics (comma separated)
            </label>
            <input
              type="text"
              value={getArrayFieldValue('aromatics')}
              onChange={(e) => handleArrayFieldChange('aromatics', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., garlic, onion, ginger"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condiments (comma separated)
            </label>
            <input
              type="text"
              value={getArrayFieldValue('condiments')}
              onChange={(e) => handleArrayFieldChange('condiments', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., soy sauce, salt, pepper"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructions
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              rows={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter cooking instructions..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={getArrayFieldValue('tags')}
              onChange={(e) => handleArrayFieldChange('tags', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., quick, vegetarian, spicy"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-md"
            >
              {editingRecipe ? 'Update Recipe' : 'Save Recipe'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingRecipe(null);
                resetForm();
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Recipes grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe) => (
          <div key={recipe.id} className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-200">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-gray-800">{recipe.name}</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => editRecipe(recipe)}
                  className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                  title="Edit recipe"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => deleteRecipe(recipe.id!)}
                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                  title="Delete recipe"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {recipe.time && (
              <div className="mb-3">
                <span className="text-sm text-gray-600">
                  ⏱️ {recipe.time} hour{parseFloat(recipe.time) !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {recipe.ingredients.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Ingredients:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      <span>{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recipe.aromatics && recipe.aromatics.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Aromatics:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {recipe.aromatics.map((aromatic, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      <span>{aromatic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recipe.condiments && recipe.condiments.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Condiments:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {recipe.condiments.map((condiment, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span>{condiment}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recipe.instructions && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Instructions:</h4>
                <p className="text-sm text-gray-600">
                  {recipe.instructions}
                </p>
              </div>
            )}

            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {recipe.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredRecipes.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🍽️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || selectedTag !== 'all' ? 'No recipes found' : 'No recipes yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedTag !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Start building your recipe collection by adding your first recipe!'
            }
          </p>
          {!searchTerm && selectedTag === 'all' && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-md"
            >
              Add Your First Recipe
            </button>
          )}
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.recipe && (
        <ConfirmModal
          isOpen={deleteModal.show}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
          title="Delete Recipe"
          message={`Are you sure you want to delete "${deleteModal.recipe.name}"? This action cannot be undone.`}
          confirmText="Delete Recipe"
          type="danger"
        />
      )}
    </div>
  );
} 