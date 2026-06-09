'use client'

import { useMemo, useState } from 'react'

import { Loader, PageTitle, withNavAccess } from '@components'
import { getLocaleText, getUILocaleSection } from '@helpers'
import { services } from '@services'
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Search, Users } from 'lucide-react'
import { toast } from 'sonner'

import localeDictionary from './locale.json'

const Page = () => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const [search, setSearch] = useState('')
	const queryClient = useQueryClient()

	const { data: departments, isLoading } = useQuery({
		...services.department.getAllOptions(),
	})

	const { mutate: syncDepartments, isPending } = useMutation({
		...services.department.syncOptions(),
		onSuccess: () => {
			toast.success(t.syncSuccess)
			queryClient.invalidateQueries({ queryKey: ['departments'] })
			queryClient.invalidateQueries({ queryKey: ['awards-departments'] })
			queryClient.invalidateQueries({ queryKey: ['statistics-top-departments'] })
		},
		onError: () => {
			toast.error(t.syncError)
		},
	})

	const filteredDepartments = useMemo(() => {
		const list = [...(departments ?? [])].sort((a, b) => b.totalPoints - a.totalPoints)

		if (!search.trim()) return list

		const value = search.trim().toLowerCase()

		return list.filter((department) => {
			const name = getLocaleText(department.name, locale).toLowerCase()

			return name.includes(value)
		})
	}, [departments, locale, search])

	if (isLoading) return <Loader type='data' />

	return (
		<section className='mx-auto w-full max-w-5xl space-y-6 p-6'>
			<PageTitle description={t.description}>{t.title}</PageTitle>

			<Card>
				<CardHeader className='pb-3'>
					<CardTitle className='text-lg'>{t.syncTitle}</CardTitle>
					<CardDescription>{t.syncDescription}</CardDescription>
				</CardHeader>
				<CardContent className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
					<p className='text-sm text-muted-foreground'>{t.syncHint}</p>
					<Button className='gap-2' disabled={isPending} onClick={() => syncDepartments()}>
						<RefreshCw className={isPending ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
						{isPending ? t.syncing : t.sync}
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className='space-y-3'>
					<CardTitle className='flex items-center gap-2'>
						<Users className='h-5 w-5 text-primary' />
						{t.title}
					</CardTitle>
					<div className='relative max-w-sm'>
						<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
						<Input
							className='pl-9'
							placeholder={t.searchPlaceholder}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
				</CardHeader>

				<CardContent className='space-y-3'>
					{filteredDepartments.length ? (
						filteredDepartments.map((department) => {
							const departmentName = getLocaleText(department.name, locale)

							return (
								<div
									key={department.keycloakId}
									className='flex flex-col gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between'
								>
									<div className='min-w-0'>
										<p className='font-medium'>{departmentName}</p>
										<p className='text-sm text-muted-foreground'>
											{department.userCount} {t.usersCount}
										</p>
									</div>
									<Badge variant='secondary' className='w-fit'>
										{department.totalPoints} {t.points}
									</Badge>
								</div>
							)
						})
					) : (
						<p className='py-8 text-center text-muted-foreground'>
							{search.trim() ? t.notFound : t.empty}
						</p>
					)}
				</CardContent>
			</Card>
		</section>
	)
}

export default withNavAccess(Page)
