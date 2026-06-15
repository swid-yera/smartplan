'use client'

import type { FC } from 'react'

import { AwardsCard, Pagination } from '@components'
import type { IAward } from '@types'

import { AwardFilterCard } from '../../../kpi/components'

interface IProps {
	awards: IAward[]
	description: string
	isLoading: boolean
	page: number
	pageSize: number
	persistedFilterClassName?: string
	title: string
	totalCount?: number
	totalPages: number
	onPageChange: (page: number) => void
	onPageSizeChange: (pageSize: number) => void
}

export const UserKpiUnsortTab: FC<IProps> = ({
	awards,
	description,
	isLoading,
	page,
	pageSize,
	persistedFilterClassName,
	title,
	totalCount,
	totalPages,
	onPageChange,
	onPageSizeChange,
}) => {
	return (
		<div className='space-y-4'>
			<AwardFilterCard compact className={persistedFilterClassName || 'mb-4'} />

			<AwardsCard awards={awards} description={description} isLoading={isLoading} title={title} />

			<Pagination
				page={page}
				pageSize={pageSize}
				pageSizeOptions={[10, 20, 50]}
				totalCount={totalCount}
				totalPages={totalPages}
				onPageChange={onPageChange}
				onPageSizeChange={onPageSizeChange}
			/>
		</div>
	)
}
