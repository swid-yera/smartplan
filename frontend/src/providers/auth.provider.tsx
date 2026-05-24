import type { FC } from 'react'

import { AuthInitializer } from '@store'

interface AuthProviderProps {
	hasSid: boolean
}

export const AuthProvider: FC<AuthProviderProps> = ({ hasSid }) => {
	return <AuthInitializer hasSid={hasSid} />
}
