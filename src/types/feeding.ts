export interface Feeding {
  id: string;
  familyId: string;
  babyName: string;
  amount: number; // stored in ml
  unit: "ml" | "oz";
  loggedBy: string;
  loggedByName: string;
  timestamp: Date;
  createdAt: Date;
}
