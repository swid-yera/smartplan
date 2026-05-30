const RUP_LANGUAGE_GENERATION_TRACKER_KEY = 'rup-language-generation-tracker'

const readTrackedRups = (): string[] => {
	if (typeof window === 'undefined') return []

	try {
		const raw = window.localStorage.getItem(RUP_LANGUAGE_GENERATION_TRACKER_KEY)
		if (!raw) return []

		const parsed = JSON.parse(raw)
		if (!Array.isArray(parsed)) return []

		return parsed
			.map((value) => String(value).trim())
			.filter(Boolean)
			.filter((value, index, values) => values.indexOf(value) === index)
	} catch {
		return []
	}
}

const writeTrackedRups = (ids: string[]) => {
	if (typeof window === 'undefined') return

	window.localStorage.setItem(RUP_LANGUAGE_GENERATION_TRACKER_KEY, JSON.stringify(ids))
}

export const listTrackedLanguageGenerations = (): string[] => readTrackedRups()

export const trackLanguageGeneration = (rupId: string) => {
	const id = String(rupId).trim()
	if (!id) return

	const tracked = readTrackedRups()
	if (tracked.includes(id)) return

	writeTrackedRups([...tracked, id])
}

export const untrackLanguageGeneration = (rupId: string) => {
	const id = String(rupId).trim()
	if (!id) return

	const tracked = readTrackedRups()
	if (!tracked.length) return

	writeTrackedRups(tracked.filter((trackedId) => trackedId !== id))
}
