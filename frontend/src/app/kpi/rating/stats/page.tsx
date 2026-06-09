'use client'

import { Loader, withPermission } from '@components'
import { getUILocaleSection } from '@helpers'
import { services } from '@services'
import { useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { PermissionCodeEnum } from '@types'

import localeDictionary from './locale.json'
import { RatingStatsClient } from './rating-stats-client'

const Page = () => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	const { data: teachers, isLoading } = useQuery({
		...services.user.getTeachersRatingOptions(),
	})

	if (isLoading) {
		return <Loader type='data' />
	}

	return <RatingStatsClient locale={locale} t={t} teachers={teachers || []} />
}

export default withPermission(Page, [PermissionCodeEnum.KPI_MANAGE])
