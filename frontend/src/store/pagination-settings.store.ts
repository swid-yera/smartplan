'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

const DEFAULT_PAGE_SIZE = 10
const STORAGE_KEY = 'eduplan-pagination-settings'

const createNoopStorage = () => ({
	getItem: () => null,
	removeItem: () => {},
	setItem: () => {},
})

interface PaginationSettingsState {
	pageSize: number
	setPageSize: (pageSize: number) => void
}

const normalizePageSize = (pageSize: number): number => {
	if (!Number.isFinite(pageSize) || pageSize <= 0) {
		return DEFAULT_PAGE_SIZE
	}

	return Math.trunc(pageSize)
}

export const usePaginationSettingsStore = create<PaginationSettingsState>()(
	persist(
		(set) => ({
			pageSize: DEFAULT_PAGE_SIZE,
			setPageSize: (pageSize) => set({ pageSize: normalizePageSize(pageSize) }),
		}),
		{
			name: STORAGE_KEY,
			partialize: (state) => ({ pageSize: state.pageSize }),
			storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : createNoopStorage())),
		},
	),
)
