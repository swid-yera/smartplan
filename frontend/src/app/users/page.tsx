'use client'

import { useState } from 'react'

import { Loader, PageTitle } from '@components'
import { services } from '@services'
import { useAuthStore } from '@store'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui'

import { UsersFilter } from './users-filter'
import { UsersPagination } from './users-pagination'
import { UsersTable } from './users-table'

function Page() {
	const { authLoading, isAuthenticated } = useAuthStore()

	// queries
	const { data: users = [], isLoading } = useQuery({ ...services.user.getAllOptions(), enabled: !isAuthenticated })

	// states
	const [search, setSearch] = useState('')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(10)
	const [selectedRole, setSelectedRole] = useState('all')

	const toggleSort = () => {
		setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
	}

	const filteredUsers = users
		.filter((user) => {
			const searchLower = search.toLowerCase()
			const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()

			const matchesSearch = fullName.includes(searchLower) || user?.email?.toLowerCase().includes(searchLower)
			const matchesRole = selectedRole === 'all' || user.role === selectedRole

			return matchesSearch && matchesRole
		})
		.sort((a, b) => {
			const nameA = `${a.firstName} ${a.lastName}`.toLowerCase()
			const nameB = `${b.firstName} ${b.lastName}`.toLowerCase()

			if (sortOrder === 'asc') {
				return nameA.localeCompare(nameB)
			}

			return nameB.localeCompare(nameA)
		})

	const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
	const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

	if (isLoading || authLoading) {
		return <Loader type='data' />
	}

	return (
		<div className='w-full mx-auto py-10 px-2 md:px-4 space-y-8'>
			<PageTitle description='Управляйте списком пользователей, просматривайте их контактные данные и роли.'>
				Пользователи сайта
			</PageTitle>

			<Card>
				<CardHeader>
					<CardTitle>Список пользователи</CardTitle>
					<CardDescription>Всего пользователи: {users.length}. Используйте поиск для фильтрации.</CardDescription>
				</CardHeader>

				<CardContent className='min-w-0 flex-1'>
					<UsersFilter
						role={selectedRole}
						search={search}
						onRoleChange={(value) => {
							setSelectedRole(value)
							setCurrentPage(1)
						}}
						onSearchChange={(value) => {
							setSearch(value)
							setCurrentPage(1)
						}}
						onSortToggle={toggleSort}
					/>

					<UsersTable users={paginatedUsers} />

					<UsersPagination
						currentPage={currentPage}
						itemsPerPage={itemsPerPage}
						totalPages={totalPages}
						onItemsPerPageChange={(value) => {
							setItemsPerPage(value)
							setCurrentPage(1)
						}}
						onPageChange={setCurrentPage}
					/>
				</CardContent>
			</Card>
		</div>
	)
}

export default Page
