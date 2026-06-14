'use client'

import { useEffect, useMemo, useState } from 'react'

import { AwardsCard, Pagination } from '@components'
import type { IAward } from '@types'

const AWARDS_PAGE_SIZE = 10

interface IProps {
	awards: IAward[]
	description: string
	title: string
}

export const CategoryAwardsClient = ({ awards, description, title }: IProps) => {
	const [currentPage, setCurrentPage] = useState(1)
	const totalPages = Math.max(1, Math.ceil(awards.length / AWARDS_PAGE_SIZE))

	useEffect(() => {
		if (currentPage > totalPages) {
			setCurrentPage(totalPages)
		}
	}, [currentPage, totalPages])

	const paginatedAwards = useMemo(() => {
		const start = (currentPage - 1) * AWARDS_PAGE_SIZE

		return awards.slice(start, start + AWARDS_PAGE_SIZE)
	}, [awards, currentPage])

	return (
		<div className='space-y-4'>
			<AwardsCard awards={paginatedAwards} description={description} isLoading={false} title={title} />
			<Pagination
				page={currentPage}
				pageSize={AWARDS_PAGE_SIZE}
				totalPages={totalPages}
				totalCount={awards.length}
				onPageChange={setCurrentPage}
			/>
		</div>
	)
}
