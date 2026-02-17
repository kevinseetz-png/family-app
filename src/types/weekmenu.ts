export interface WeekMenuDays {
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
}

export type DayKey = keyof WeekMenuDays;

export interface WeekMenuIngredients {
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
}

export interface WeekMenu {
  id: string;
  familyId: string;
  days: WeekMenuDays;
  ingredients: WeekMenuIngredients;
  updatedBy: string;
  updatedByName: string;
  updatedAt: Date;
}
