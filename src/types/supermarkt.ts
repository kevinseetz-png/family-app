export type SupermarktId =
  | "ah" | "jumbo" | "picnic" | "dirk" | "dekamarkt"
  | "lidl" | "aldi" | "plus" | "hoogvliet" | "spar"
  | "vomar" | "poiesz";

export interface SupermarktProduct {
  id: string;
  name: string;
  price: number;
  displayPrice: string;
  unitQuantity: string;
  imageUrl: string | null;
  supermarkt: SupermarktId;
}

export interface SupermarktResult {
  supermarkt: SupermarktId;
  label: string;
  products: SupermarktProduct[];
  error: string | null;
}

export const SUPERMARKT_LABELS: Record<SupermarktId, string> = {
  ah: "Albert Heijn",
  jumbo: "Jumbo",
  picnic: "Picnic",
  dirk: "Dirk",
  dekamarkt: "DekaMarkt",
  lidl: "Lidl",
  aldi: "Aldi",
  plus: "Plus",
  hoogvliet: "Hoogvliet",
  spar: "SPAR",
  vomar: "Vomar",
  poiesz: "Poiesz",
};
