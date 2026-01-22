import { create } from "zustand"

export interface VmsFilters {
  fromDate: Date | undefined
  toDate: Date | undefined
  vehicle: string
  costCenter: string
  status: string
  shift: string
}

interface VmsFiltersStore {
  filters: VmsFilters
  setFilters: (filters: Partial<VmsFilters>) => void
  resetFilters: () => void
}

const defaultFilters: VmsFilters = {
  fromDate: undefined,
  toDate: undefined,
  vehicle: "all",
  costCenter: "all",
  status: "all",
  shift: "all",
}

export const useVmsFilters = create<VmsFiltersStore>((set) => ({
  filters: defaultFilters,
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  resetFilters: () => set({ filters: defaultFilters }),
}))

