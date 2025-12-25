'use client'

import { useEffect } from 'react'

import { services } from '@services'
import { useQuery } from '@tanstack/react-query'

import { useAuthStore } from './auth.store'

// use auth bootstrap
export const useAuthBootstrap = () => {
	const setUser = useAuthStore((s) => s.setUser)

	const { data, isError } = useQuery({
		...services.auth.getMeOptions,
		enabled: true,
	})

	useEffect(() => {
		if (data) {
			setUser(data)
		}

		if (isError) {
			setUser(null)
		}
	}, [data, isError, setUser])
}

// initializer/trigger
export const AuthInitializer = () => {
	useAuthBootstrap()

	return null
}
