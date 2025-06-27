export type Meal = {
  id?: string;
  name: string;
  ingredients: string[];
  aromatics: string[];
  condiments: string[];
  time: string;
  instructions?: string;
  tags?: string[];
};

export type DayPlan = Record<string, Meal | string> & {
  notes?: string;
};

export type Planner = {
  [day: string]: DayPlan;
}; 