'use client'

import { useEffect, useRef } from 'react'

import { services } from '@services'
import { useQuery } from '@tanstack/react-query'

import { useAuthStore } from './auth.store'

// use auth bootstrap
export const useAuthBootstrap = (hasSid: boolean) => {
	const setUser = useAuthStore((s) => s.setUser)
	const isFirstRender = useRef(true)

	const { data, isError } = useQuery({
		...services.auth.getMeOptions(),
		enabled: hasSid, // Запрос не пойдет, если куки нет
		refetchInterval: 15000,
		refetchIntervalInBackground: true,
	})

	if (isFirstRender.current) {
		if (hasSid) {
			useAuthStore.setState({ authLoading: true })
		} else {
			useAuthStore.setState({ authLoading: false })
		}
		isFirstRender.current = false
	}

	useEffect(() => {
		if (data) setUser(data)
		if (isError || !hasSid) setUser(null)
	}, [data, isError, hasSid, setUser])
}

// initializer/trigger
export const AuthInitializer = ({ hasSid }: { hasSid: boolean }) => {
	useAuthBootstrap(hasSid)

	return null
}
