'use client'

import { useState } from 'react'

import Link from 'next/link'

import { Loader, PageTitle, Pagination } from '@components'
import { getUILocaleSection } from '@helpers'
import { services } from '@services'
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BarChart3, Search, UserIcon } from 'lucide-react'
import localeDictionary from './locale.json'

export default function RatingAllPage() {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const [searchInput, setSearchInput] = useState('')
	const [search, setSearch] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize, setPageSize] = useState(10)

	const applySearch = () => {
		setCurrentPage(1)
		setSearch(searchInput.trim())
	}

	const { data: usersData, isLoading } = useQuery({
		...services.user.getAllRatingOptions({
			currentPage,
			pageSize,
			search,
		}),
	})

	if (isLoading || !usersData) {
		return <Loader fullScreen type='default' />
	}

	return (
		<section className='mx-auto w-full max-w-5xl p-6 space-y-6'>
			<PageTitle description={t.description}>{t.title}</PageTitle>

			{/* HEADER */}
			<Card>
				<CardHeader className='space-y-4'>
					<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<CardTitle>{t.headerTitle}</CardTitle>
							<CardDescription>{t.headerDescription}</CardDescription>
						</div>

						<div className='flex gap-2'>
							<Button asChild size='sm' variant='outline'>
							<Link href='/kpi/rating'>
								<ArrowLeft className='mr-2 h-4 w-4' />
								{t.top20}
							</Link>
							</Button>

							<Button asChild size='sm' variant='outline'>
							<Link href='/kpi/rating/stats'>
								<BarChart3 className='mr-2 h-4 w-4' />
								{t.stats}
							</Link>
							</Button>
						</div>
					</div>

					{/* SEARCH */}
					<div className='flex gap-2 max-w-xl'>
						<div className='relative flex-1'>
							<Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
							<Input
								className='pl-9'
								placeholder={t.searchPlaceholder}
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') applySearch()
								}}
							/>
						</div>

						<Button onClick={applySearch}>
							<Search className='mr-2 h-4 w-4' />
							{t.search}
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
							{usersData.data.map((u, i) => {
								const globalIndex = (currentPage - 1) * usersData.meta.pageSize + i

								return (
									<TableRow key={u.keycloakId}>
										<TableCell className='text-center font-medium'>{globalIndex + 1}</TableCell>

										<TableCell>
											<Link className='flex items-center gap-2' href={`/users/${u.keycloakId}`}>
												<UserIcon className='h-4 w-4 text-muted-foreground' />
												{u.firstName} {u.lastName}
											</Link>
										</TableCell>

										<TableCell className='text-right font-medium pr-10'>{u.totalPoints}</TableCell>
									</TableRow>
								)
							})}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* PAGINATION */}
			<Pagination
				page={usersData.meta.currentPage}
				pageSize={usersData.meta.pageSize}
				totalPages={usersData.meta.total}
				onPageChange={(page) => setCurrentPage(page)}
				onPageSizeChange={(size) => setPageSize(size)}
			/>
		</section>
	)
}
