import type { Client, ClientStatus } from '@/types/entities/client.types'

export type ClientFormValues = {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  notes: string
  status: ClientStatus
}

export type ClientSortField = 'name' | 'createdAt' | 'status'
export type SortDirection = 'asc' | 'desc'

export type ClientSort = {
  field: ClientSortField
  direction: SortDirection
}

export type ClientStatusFilter = ClientStatus | 'all'

export type ClientFilters = {
  search: string
  status: ClientStatusFilter
  sort: ClientSort
  page: number
  pageSize: number
}

export type ClientTableRow = Client & {
  fullName: string
}

export const DEFAULT_CLIENT_FILTERS: ClientFilters = {
  search: '',
  status: 'all',
  sort: { field: 'createdAt', direction: 'desc' },
  page: 1,
  pageSize: 10,
}

export const EMPTY_CLIENT_FORM: ClientFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
  status: 'active',
}
