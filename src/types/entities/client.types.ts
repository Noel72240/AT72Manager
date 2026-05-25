export type ClientStatus = 'active' | 'inactive' | 'prospect'

export type Client = {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  address?: string
  status: ClientStatus
  notes?: string
  createdAt: string
  updatedAt: string
  userId: string
}

export type ClientInsert = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
export type ClientUpdate = Partial<Omit<Client, 'id' | 'userId' | 'createdAt'>>
