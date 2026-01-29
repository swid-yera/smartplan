'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Loader, PageTitle, Pagination, RupsCard } from '@components'
import { services } from '@services'
import { Button } from '@shadcn'
import { useAuthStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'

const Page = () => {
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()

	const page = Number(searchParams.get('page')) || 1
	const pageSize = Number(searchParams.get('pageSize')) || 10

	const { user, authLoading } = useAuthStore()

	const { data: rupsData, isLoading: isRupsLoading } = useQuery({
		...services.rup.getAllOptions({
			currentPage: page,
			pageSize: pageSize,
			teacher: user?.keycloakId,
		}),
		enabled: !!user,
	})

	const setCurrentPage = (newPage: number) => {
		const params = new URLSearchParams(searchParams.toString())

		params.set('page', String(newPage))
		router.push(`${pathname}?${params.toString()}`)
	}

	const setPageSize = (newSize: number) => {
		const params = new URLSearchParams(searchParams.toString())

		params.set('pageSize', String(newSize))
		params.set('page', '1')
		router.push(`${pathname}?${params.toString()}`)
	}

	if (!user || authLoading) return <Loader type='data' />

	return (
		<section className='p-4 w-full space-y-4'>
			<PageTitle
				actions={
					<Button asChild>
						<Link href='/rups/create'>
							<Plus className='mr-2 h-4 w-4' />
							Создать РУП
						</Link>
					</Button>
				}
				description='Мои созданные рабочие учебные программы'
			>
				Мои РУП
			</PageTitle>

			<RupsCard
				showCreateOnEmpty
				currentPage={rupsData?.meta.currentPage || 1}
				isLoading={isRupsLoading}
				rups={rupsData?.data || []}
				title='Список ваших РУП'
				totalPages={rupsData?.meta.pages || 1}
				onPageChange={setCurrentPage}
			/>

			<Pagination
				page={rupsData?.meta.currentPage || 1}
				pageSize={rupsData?.meta.pageSize || 10}
				pageSizeOptions={[10, 20, 50]}
				totalPages={rupsData?.meta.pages || 1}
				onPageChange={setCurrentPage}
				onPageSizeChange={setPageSize}
			/>
		</section>
	)
}

export default Page
