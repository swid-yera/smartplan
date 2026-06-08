import { Forbidden } from '@components'
import { getUILocaleSection, hasRole } from '@helpers'
import { getServerAuthUser, getServerLocale, serverFetchJson } from '@lib/server'
import type { IUser } from '@types'
import { RoleEnum } from '@types'

import localeDictionary from './locale.json'
import { RatingStatsClient } from './rating-stats-client'

export default async function RatingStatsPage() {
	const [locale, user] = await Promise.all([getServerLocale(), getServerAuthUser()])

	if (!user || !hasRole(user.role, RoleEnum.METHODIST, true)) {
		return <Forbidden />
	}

	const teachers = await serverFetchJson<IUser[]>('/statistics/teachers/rating', {
		includeSid: true,
		revalidate: 120,
	})

	const t = getUILocaleSection(localeDictionary, locale)

	return <RatingStatsClient locale={locale} t={t} teachers={teachers} />
}
