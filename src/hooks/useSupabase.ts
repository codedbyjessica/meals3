import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { type Meal, type Planner } from '@/types/meal';

interface PlannerPayload {
  id: string;
  user_id: string;
  data: Planner;
  updated_at: string;
}

export function useSupabase() {
  const [planner, setPlanner] = useState<Planner>({});
  const [recipes, setRecipes] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [plannerId, setPlannerId] = useState<string | null>(null);

  // Get current user
  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  };

  // Load recipes from Supabase
  const loadRecipes = useCallback(async () => {
    try {
      setError(null);
      
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('recipe')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      
      console.log('Loaded recipes:', data?.length || 0);
      setRecipes(data || []);
    } catch (err) {
      setError('Failed to load recipes');
      console.error('Error loading recipes:', err);
    }
  }, []);

  // Save planner data to Supabase
  const savePlanner = async (plannerData: Planner) => {
    try {
      setError(null);
      setIsUpdating(true);
      
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      console.log('Saving planner data:', plannerData);
      
      // Always use the plannerId from state if we have it
      let currentPlannerId = plannerId;
      
      if (!currentPlannerId) {
        // If we don't have a plannerId, try to find existing planner for this user
        const { data: existingPlanner, error: fetchError } = await supabase
          .from('meal_planner')
          .select('id, data')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
          throw fetchError;
        }
        
        if (existingPlanner) {
          currentPlannerId = existingPlanner.id;
          console.log('Found existing planner with ID:', currentPlannerId);
          // Merge with existing data, properly handling nested meal structure
          const mergedData = mergePlannerData(existingPlanner.data, plannerData);
          console.log('Merged data:', mergedData);
          plannerData = mergedData;
        } else {
          // Generate new planner ID for first save
          currentPlannerId = crypto.randomUUID();
          console.log('No existing planner found, creating new one with ID:', currentPlannerId);
        }
        
        setPlannerId(currentPlannerId);
      } else {
        // We have a plannerId, so merge with current planner state
        const mergedData = mergePlannerData(planner, plannerData);
        console.log('Merged with current planner state:', mergedData);
        plannerData = mergedData;
      }
      
      // Always update the planner with the current ID
      const { error } = await supabase
        .from('meal_planner')
        .upsert({ 
          id: currentPlannerId, 
          user_id: user.id,
          data: plannerData,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      console.log('Planner saved successfully with ID:', currentPlannerId);
      setPlanner(plannerData);
    } catch (err) {
      setError('Failed to save meal planner');
      console.error('Error saving planner:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper function to properly merge planner data
  const mergePlannerData = (existingData: Planner, newData: Planner): Planner => {
    const merged: Planner = { ...existingData };
    
    // For each date in the new data
    Object.keys(newData).forEach(date => {
      if (!merged[date]) {
        // If date doesn't exist, add it entirely
        merged[date] = { ...newData[date] };
      } else {
        // If date exists, merge the meals within that date
        merged[date] = { ...merged[date], ...newData[date] };
      }
    });
    
    return merged;
  };

  // Load planner data from Supabase
  const loadPlanner = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Find the user's planner by user_id, get the most recent one if duplicates exist
      const { data, error } = await supabase
        .from('meal_planner')
        .select('id, data')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }
      
      if (data) {
        console.log('Loading planner with ID:', data.id);
        setPlannerId(data.id);
        setPlanner(data.data);
      } else {
        console.log('No planner found for user');
      }
    } catch (err) {
      setError('Failed to load meal planner');
      console.error('Error loading planner:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a specific meal
  const updateMeal = async (day: string, mealType: string, meal: Meal) => {
    try {
      setError(null);
      setIsUpdating(true);
      console.log('Updating meal:', { day, mealType, meal });
      
      // Create the updated planner data
      const updatedPlanner = {
        ...planner,
        [day]: {
          ...planner[day],
          [mealType]: meal,
        },
      };
      
      console.log('Updated planner to save:', updatedPlanner);
      
      // Update local state first
      setPlanner(updatedPlanner);
      
      // Save to Supabase
      await savePlanner(updatedPlanner);
      
      console.log('Meal updated successfully');
    } catch (err) {
      setError('Failed to update meal');
      console.error('Error updating meal:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Listen for real-time updates
  useEffect(() => {
    const plannerSubscription = supabase
      .channel('meal_planner_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meal_planner'
        },
        (payload) => {
          console.log('Supabase planner data received:', payload);
          console.log('isUpdating flag:', isUpdating);
          
          // Don't overwrite local state if we're in the middle of an update
          if (isUpdating) {
            console.log('Skipping subscription update because we are updating');
            return;
          }
          
          if (payload.new) {
            const plannerData = (payload.new as PlannerPayload).data;
            console.log('Setting planner state to:', plannerData);
            setPlanner(plannerData);
          } else {
            console.log('No planner data exists in Supabase');
            setPlanner({});
          }
          setLoading(false);
        }
      )
      .subscribe();

    const recipesSubscription = supabase
      .channel('recipe_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recipe'
        },
        (payload) => {
          console.log('Recipe change detected:', payload);
          // Reload recipes when changes occur
          loadRecipes();
        }
      )
      .subscribe();

    // Load initial data
    loadPlanner();
    loadRecipes();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(plannerSubscription);
      supabase.removeChannel(recipesSubscription);
    };
  }, [isUpdating, loadPlanner, loadRecipes]);

  return {
    planner,
    recipes,
    loading,
    error,
    savePlanner,
    loadPlanner,
    loadRecipes,
    updateMeal,
  };
} 