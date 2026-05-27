export interface Holding {
  id: string;
  userId: string;
  assetId: string;
  quantity: string;
  costBasis: string;
  costBasisCurrency: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomAsset {
  id: string;
  userId: string;
  name: string;
  value: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}
