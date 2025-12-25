'use client'

import { useEffect, useState } from 'react'

export const useSession = (): { session: string | null; loading: boolean } => {
	const [session, setSession] = useState(null)
	const [loading, setLoading] = useState<boolean>(true)

	useEffect(() => {})

	return { session, loading }
}
