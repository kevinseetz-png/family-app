export type FoodType = "breast_milk" | "formula" | "puree" | "solid" | "snack";
export type FeedingUnit = "ml" | "g";

export interface Feeding {
  id: string;
  familyId: string;
  foodType: FoodType;
  amount: number;
  unit: FeedingUnit;
  loggedBy: string;
  loggedByName: string;
  timestamp: Date;
  createdAt: Date;
}

export const FOOD_TYPE_LABELS: Record<FoodType, string> = {
  breast_milk: "Moedermelk",
  formula: "Flesvoeding",
  puree: "Puree",
  solid: "Vast voedsel",
  snack: "Snack",
};
