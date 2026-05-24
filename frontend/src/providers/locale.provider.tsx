'use client'

import { type FC, type PropsWithChildren, useEffect } from 'react'

import { useLocaleStore } from '@store'

export const LocaleProvider: FC<PropsWithChildren> = ({ children }) => {
	const initializeLocale = useLocaleStore((state) => state.initializeLocale)

	useEffect(() => {
		initializeLocale()
	}, [initializeLocale])

	return children
}
