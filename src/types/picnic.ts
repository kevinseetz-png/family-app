export interface PicnicProduct {
  id: string;
  name: string;
  imageId: string;
  price: number;
  displayPrice: string;
  unitQuantity: string;
  maxCount: number;
}

export interface PicnicCartSelection {
  productId: string;
  count: number;
}
