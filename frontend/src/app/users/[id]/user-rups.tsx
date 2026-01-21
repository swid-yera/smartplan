import { type FC, useState } from 'react'

import { RupsCard } from '@components'
import type { IRup } from '@types'
import { Spinner } from '@ui'

interface IUserRupsProps {
	createdRups: IRup[]
	assessmentRups: IRup[]
	isLoading: boolean
}

export const UserRups: FC<IUserRupsProps> = ({ createdRups, assessmentRups, isLoading }) => {
	// states
	const [createdRupsCurrentPage, setCreatedRupsCurrentPage] = useState(1)
	const [assessmentRupsCurrentPage, setAssessmentRupsCurrentPage] = useState(1)

	if (isLoading) return <Spinner className='mx-auto size-6' />

	const createdRupsTotalPages = Math.ceil(createdRups.length / 10)
	const createdRupsPaginated = createdRups.slice((createdRupsCurrentPage - 1) * 10, createdRupsCurrentPage * 10)
	const assessmentRupsTotalPages = Math.ceil(assessmentRups.length / 10)
	const assessmentRupsPaginated = assessmentRups.slice(
		(assessmentRupsCurrentPage - 1) * 10,
		assessmentRupsCurrentPage * 10,
	)

	return (
		<>
			<RupsCard
				currentPage={createdRupsCurrentPage}
				rups={createdRupsPaginated}
				title='Созданные Рабочие учебные планы от пользователя'
				totalPages={createdRupsTotalPages}
				onPageChange={setCreatedRupsCurrentPage}
			/>

			<RupsCard
				currentPage={assessmentRupsCurrentPage}
				rups={assessmentRupsPaginated}
				title='Рабочие учебные планы под управлением пользователя'
				totalPages={assessmentRupsTotalPages}
				onPageChange={setAssessmentRupsCurrentPage}
			/>
		</>
	)
}
