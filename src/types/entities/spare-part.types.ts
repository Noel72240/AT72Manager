export type StockLevel = 'ok' | 'low' | 'out'

export type SparePart = {
  id: string
  name: string
  category: string
  reference: string
  supplier?: string
  purchasePrice: number
  salePrice: number
  quantity: number
  minThreshold: number
  notes?: string
  createdAt: string
  updatedAt: string
  userId: string
}

export type SparePartInsert = Omit<SparePart, 'id' | 'createdAt' | 'updatedAt'>
export type SparePartUpdate = Partial<
  Omit<SparePart, 'id' | 'userId' | 'createdAt'>
>
