'use client'

import Link from 'next/link'

import { Loader, PageTitle } from '@components'
import { getUILocaleSection } from '@helpers'
import { services } from '@services'
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Building2, Crown, Medal, Users } from 'lucide-react'
import localeDictionary from './locale.json'

const placeStyles = (index: number) => {
	if (index === 0) return 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400'
	if (index === 1) return 'bg-gray-50 text-gray-600 dark:bg-zinc-900 dark:text-zinc-300'
	if (index === 2) return 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400'

	return ''
}

const placeIcon = (index: number) => {
	if (index === 0) return <Crown className='h-4 w-4 text-yellow-500' />
	if (index === 1) return <Medal className='h-4 w-4 text-gray-500' />
	if (index === 2) return <Medal className='h-4 w-4 text-orange-500' />

	return null
}

export default function RatingPage() {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const { data: usersData, isLoading } = useQuery({
		...services.user.getAllRatingOptions({
			currentPage: 1,
			pageSize: 20,
			search: '',
		}),
	})

	if (isLoading || !usersData) {
		return <Loader fullScreen type='default' />
	}

	return (
		<section className='mx-auto w-full max-w-4xl p-6 space-y-6'>
			<PageTitle description={t.description}>{t.title}</PageTitle>

			{/* HEADER */}
			<Card>
				<CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
					<div>
						<CardTitle>{t.headerTitle}</CardTitle>
						<CardDescription>{t.headerDescription}</CardDescription>
					</div>

					<div className='flex gap-2'>
						<Button asChild size='sm' variant='outline'>
							<Link href='/kpi/rating/all'>
								<Users className='mr-2 h-4 w-4' />
								{t.allTeachers}
							</Link>
						</Button>

						<Button asChild size='sm' variant='outline'>
							<Link href='/kpi/rating/departments'>
								<Building2 className='mr-2 h-4 w-4' />
								{t.departments}
							</Link>
						</Button>

						<Button asChild size='sm' variant='outline'>
							<Link href='/kpi/rating/stats'>
								<BarChart3 className='mr-2 h-4 w-4' />
								{t.stats}
							</Link>
						</Button>
					</div>
				</CardHeader>
			</Card>

			{/* TABLE */}
			<Card>
				<CardContent className='p-0'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='w-16 text-center'>#</TableHead>
								<TableHead>{t.teacher}</TableHead>
								<TableHead className='text-right pr-10'>{t.points}</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{usersData.data.map((u, index) => (
								<TableRow key={u.keycloakId} className={placeStyles(index)}>
									<TableCell className='py-4 text-center font-semibold'>{index + 1}</TableCell>

									<TableCell>
										<Link className='flex items-center gap-2 text-base' href={`/users/${u.keycloakId}`}>
											{placeIcon(index)}
											{u.firstName} {u.lastName}
										</Link>
									</TableCell>

									<TableCell className='text-right text-base font-semibold pr-10'>{u.totalPoints}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</section>
	)
}
