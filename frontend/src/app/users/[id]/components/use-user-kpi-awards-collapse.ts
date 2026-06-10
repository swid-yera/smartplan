'use client'

import { useEffect, useState } from 'react'

type CollapseState = Record<string, boolean>

const getStorageKey = (userId: string) => `eduplan:users:${userId}:kpi-awards-collapse`

const readCollapseState = (userId: string): CollapseState => {
	if (typeof window === 'undefined') return {}

	try {
		const raw = localStorage.getItem(getStorageKey(userId))
		if (!raw) return {}

		const parsed = JSON.parse(raw)
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

		return Object.entries(parsed).reduce<CollapseState>((acc, [key, value]) => {
			if (typeof value === 'boolean') {
				acc[key] = value
			}

			return acc
		}, {})
	} catch {
		return {}
	}
}

export const useUserKpiAwardsCollapseState = (userId: string, categoryIds: string[]) => {
	const [collapsed, setCollapsed] = useState<CollapseState>({})
	const [hydrated, setHydrated] = useState(false)
	const categorySignature = categoryIds.join('|')

	useEffect(() => {
		if (!userId) return

		const savedState = readCollapseState(userId)
		const nextState = categoryIds.reduce<CollapseState>((acc, categoryId) => {
			acc[categoryId] = savedState[categoryId] ?? false
			return acc
		}, {})

		setCollapsed(nextState)
		setHydrated(true)
	}, [categorySignature, userId])

	useEffect(() => {
		if (!userId || !hydrated || typeof window === 'undefined') return

		localStorage.setItem(getStorageKey(userId), JSON.stringify(collapsed))
	}, [collapsed, hydrated, userId])

	const toggleCategory = (categoryId: string) => {
		setCollapsed((current) => ({
			...current,
			[categoryId]: !current[categoryId],
		}))
	}

	return {
		collapsed,
		toggleCategory,
	}
}
