'use client'

import { useParams, useRouter } from 'next/navigation'

import { Loader, PageTitle } from '@components'
import { services } from '@services'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@ui'
import { ArrowLeft } from 'lucide-react'

import { UserCard } from './user-card'
import { UserRups } from './user-rups'

export default function UserPage() {
	const router = useRouter()
	const params = useParams<{ id: string }>()

	// queries
	const {
		data: user,
		isLoading: userLoading,
		isError,
	} = useQuery({
		...services.user.getByIdOptions(params.id),
		enabled: !!params.id,
	})
	const { data: createdRups = [], isLoading: createdRupsLoading } = useQuery({
		...services.rup.getByTeacherIdOptions(params.id),
		enabled: !userLoading && !isError,
	})
	const { data: assessmentRups = [], isLoading: assessmentRupsLoading } = useQuery({
		...services.rup.getByMethodistIdOptions(params.id),
		enabled: !userLoading && !isError,
	})

	if (userLoading) {
		return <Loader />
	}

	if (isError || !user) {
		return (
			<div className='container mx-auto py-10 space-y-8 max-w-7xl text-center'>
				<h2 className='text-2xl font-bold'>Пользователь не найден</h2>
				<Button onClick={() => router.back()}>
					<ArrowLeft className='mr-2 h-4 w-4' /> Вернуться назад
				</Button>
			</div>
		)
	}

	return (
		<section className='mx-auto pb-10 pt-5 px-4 space-y-8 w-full'>
			<PageTitle
				actions={
					<div>
						<Button className='' size='sm' variant='outline' onClick={() => router.push('/users')}>
							<ArrowLeft className='mr-2 h-4 w-4' />К списку пользователей
						</Button>
					</div>
				}
			>
				Данные пользователя {user.firstName} {user.lastName}
			</PageTitle>

			<UserCard user={user} />

			<UserRups
				assessmentRups={assessmentRups}
				createdRups={createdRups}
				isLoading={createdRupsLoading || assessmentRupsLoading}
			/>
		</section>
	)
}
