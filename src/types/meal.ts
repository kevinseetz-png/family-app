export interface Meal {
  id: string;
  familyId: string;
  name: string;
  ingredients: string;
  instructions: string;
  sourceDay?: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt?: Date;
}
