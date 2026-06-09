'use client'

import { useCallback, useMemo, useState } from 'react'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { PageTitle, Pagination, withNavAccess } from '@components'
import { getUILocaleSection, hasAnyPermission, interpolateUILocaleText } from '@helpers'
import { services } from '@services'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { PermissionCodeEnum } from '@types'

import localeDictionary from './locale.json'
import { UsersFilter } from './users-filter'
import { UsersPermissionsDialog } from './users-permissions-dialog'
import { UsersTable } from './users-table'

function Page() {
	const { authLoading, isAuthenticated, user } = useAuthStore()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
	const [permissionsDialogUserId, setPermissionsDialogUserId] = useState<string | undefined>()
	const canManageUsers = hasAnyPermission(user, [PermissionCodeEnum.RUP_FULL, PermissionCodeEnum.KPI_FULL])

	const { currentPage, itemsPerPage, search } = useMemo(() => {
		const currentPage = Number(searchParams.get('page') || '1')
		const itemsPerPage = Number(searchParams.get('limit') || '10')
		const search = searchParams.get('q') || ''

		return { currentPage, itemsPerPage, search }
	}, [searchParams])

	const createQueryString = useCallback(
		(params: Record<string, string | number | null>) => {
			const newSearchParams = new URLSearchParams(searchParams.toString())

			for (const [key, value] of Object.entries(params)) {
				if (value === null || value === '') {
					newSearchParams.delete(key)
				} else {
					newSearchParams.set(key, String(value))
				}
			}

			return newSearchParams.toString()
		},
		[searchParams],
	)

	// queries
	const {
		data: usersData,
		isLoading,
		isFetching,
		isRefetching,
	} = useQuery({
		...services.user.getAllOptions({
			currentPage,
			pageSize: itemsPerPage,
			search,
		}),
		enabled: !!isAuthenticated,
	})

	const handleUrlUpdate = (params: Record<string, string | number | null>) => {
		router.push(`${pathname}?${createQueryString(params)}`)
	}

	const totalUsers = usersData?.meta.total || 0
	const totalPages = usersData?.meta.pages || 1
	const paginatedUsers = usersData?.data || []
	const defaultPermissionsDialogUserId = permissionsDialogUserId ?? paginatedUsers[0]?.keycloakId

	return (
		<div className='w-full mx-auto py-10 px-2 md:px-4 space-y-8'>
			<PageTitle description={t.page.description}>{t.page.title}</PageTitle>

			<Card>
				<CardHeader>
					<CardTitle>{t.page.cardTitle}</CardTitle>
					<CardDescription>
						{interpolateUILocaleText(t.page.cardDescription, { total: totalUsers })}{' '}
						<Link className='underline text-accent-foreground' href='/kpi/rating'>
							{t.page.ratingLink}
						</Link>
					</CardDescription>
				</CardHeader>

				<CardContent className='min-w-0 flex-1'>
					<UsersFilter
						search={search}
						onSearchSubmit={(value) => handleUrlUpdate({ q: value || null, page: 1 })}
					/>

					<UsersTable
						isLoading={isLoading || authLoading || isFetching || isRefetching}
						users={paginatedUsers}
						onManagePermissions={(selectedUser) => {
							setPermissionsDialogUserId(selectedUser.keycloakId)
							setIsPermissionsDialogOpen(true)
						}}
					/>

					<Pagination
						page={currentPage}
						pageSize={itemsPerPage}
						totalPages={totalPages}
						onPageChange={(page) => handleUrlUpdate({ page })}
						onPageSizeChange={(value) => handleUrlUpdate({ limit: value, page: 1 })}
					/>
				</CardContent>
			</Card>

			{canManageUsers ? (
				<UsersPermissionsDialog
					defaultUserId={defaultPermissionsDialogUserId}
					open={isPermissionsDialogOpen}
					onOpenChange={(open) => {
						setIsPermissionsDialogOpen(open)
						if (!open) {
							setPermissionsDialogUserId(undefined)
						}
					}}
				/>
			) : null}
		</div>
	)
}

export default withNavAccess(Page)
