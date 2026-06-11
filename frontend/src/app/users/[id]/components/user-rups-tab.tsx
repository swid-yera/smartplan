'use client'

import type { FC } from 'react'

import { RupsCard } from '@components'
import type { IRup } from '@types'

import { RupsFilterCard } from '../../../rups/components'

interface IProps {
	currentPage: number
	isLoading: boolean
	persistKey: string
	rups: IRup[]
	title: string
	totalPages: number
	onPageChange: (page: number) => void
}

export const UserRupsTab: FC<IProps> = ({
	currentPage,
	isLoading,
	persistKey,
	rups,
	title,
	totalPages,
	onPageChange,
}) => {
	return (
		<div className='space-y-4'>
			<RupsFilterCard compact className='mb-2' paramPrefix='rups' persistKey={persistKey} />

			<RupsCard
				currentPage={currentPage}
				isLoading={isLoading}
				rups={rups}
				title={title}
				totalPages={totalPages}
				onPageChange={onPageChange}
			/>
		</div>
	)
}
