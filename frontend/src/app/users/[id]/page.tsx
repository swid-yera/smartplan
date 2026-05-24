'use client'

import { useParams, useRouter } from 'next/navigation'

import { Loader, PageTitle, RupsCard } from '@components'
import { getUILocaleSection, hasRole, interpolateUILocaleText } from '@helpers'
import { services } from '@services'
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@shadcn'
import { useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { RoleEnum } from '@types'
import { ArrowLeft } from 'lucide-react'

import { UserCard } from './user-card'
import localeDictionary from './locale.json'

export default function UserPage() {
	const router = useRouter()
	const params = useParams<{ id: string }>()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	// queries
	const {
		data: userData,
		isLoading: userLoading,
		isError,
	} = useQuery({
		...services.user.getByIdOptions(params.id),
		enabled: !!params.id,
	})
	const { data: createdRups, isLoading: createdRupsLoading } = useQuery({
		...services.rup.getAllOptions({ teacher: params.id }),
		enabled: !userLoading && !isError,
	})
	const { data: assessmentRups, isLoading: assessmentRupsLoading } = useQuery({
		...services.rup.getAllOptions({ methodist: params.id }),
		enabled: !userLoading && !isError,
	})

	if (userLoading) {
		return <Loader />
	}

	if (isError || !userData) {
		return (
			<div className='container mx-auto py-10 space-y-8 max-w-7xl text-center'>
				<h2 className='text-2xl font-bold'>{t.page.notFound}</h2>
				<Button onClick={() => router.back()}>
					<ArrowLeft className='mr-2 h-4 w-4' /> {t.page.back}
				</Button>
			</div>
		)
	}

	const isTeacher = hasRole(userData.role, RoleEnum.TEACHER, false)

	return (
		<section className='mx-auto pb-10 pt-5 px-4 space-y-8 w-full'>
			<PageTitle
				actions={
					<div>
						<Button className='' size='sm' variant='outline' onClick={() => router.push('/users')}>
							<ArrowLeft className='mr-2 h-4 w-4' />
							{t.page.toList}
						</Button>
					</div>
				}
			>
				{interpolateUILocaleText(t.page.title, {
					firstName: userData.firstName,
					lastName: userData.lastName,
				})}
			</PageTitle>

			<UserCard user={userData} />

			<Tabs defaultValue={isTeacher ? 'created' : 'assessment'}>
				<TabsList>
					<TabsTrigger className='px-6' value='created'>
						{t.page.createdTab}
					</TabsTrigger>
					<TabsTrigger className='px-6' value='assessment'>
						{t.page.assessmentTab}
					</TabsTrigger>
				</TabsList>

				<TabsContent value='created'>
					<RupsCard
						currentPage={createdRups?.meta.currentPage || 1}
						isLoading={createdRupsLoading}
						rups={createdRups?.data || []}
						title={t.page.createdRupsTitle}
						totalPages={createdRups?.meta.pages || 1}
						onPageChange={() => true}
					/>
				</TabsContent>

				<TabsContent value='assessment'>
					<RupsCard
						currentPage={assessmentRups?.meta.currentPage || 1}
						isLoading={assessmentRupsLoading}
						rups={assessmentRups?.data || []}
						title={t.page.assessmentRupsTitle}
						totalPages={assessmentRups?.meta.pages || 1}
						onPageChange={() => true}
					/>
				</TabsContent>
			</Tabs>
		</section>
	)
}
