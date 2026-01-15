'use client'

import { useMemo, useState } from 'react'

import { services } from '@services'
import { useQuery } from '@tanstack/react-query'
import { Button, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ui'

export default function TeachersPage() {
	const { data: users = [], isLoading } = useQuery(services.user.getAllUsersOptions)

	const [search, setSearch] = useState('')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

	const filteredAndSortedTeachers = useMemo(() => {
		let teachers = users.filter((user) => user.roles.includes('teacher'))

		if (search) {
			teachers = teachers.filter(
				(user) =>
					user.name.toLowerCase().includes(search.toLowerCase()) ||
					user.secondName.toLowerCase().includes(search.toLowerCase()) ||
					user.email.toLowerCase().includes(search.toLowerCase()),
			)
		}

		teachers.sort((a, b) => {
			const nameA = `${a.name} ${a.secondName}`.toLowerCase()
			const nameB = `${b.name} ${b.secondName}`.toLowerCase()

			if (sortOrder === 'asc') {
				return nameA.localeCompare(nameB)
			} else {
				return nameB.localeCompare(nameA)
			}
		})

		return teachers
	}, [users, search, sortOrder])

	const toggleSort = () => {
		setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
	}

	if (isLoading) {
		return <div>Loading...</div>
	}

	return (
		<div className='container mx-auto p-4'>
			<h1 className='text-2xl font-bold mb-4'>Teachers</h1>

			<div className='flex gap-4 mb-4'>
				<Input
					className='max-w-sm'
					placeholder='Search by name or email'
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
				<Button onClick={toggleSort}>Sort by Name ({sortOrder === 'asc' ? 'A-Z' : 'Z-A'})</Button>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Phone</TableHead>
						<TableHead>Roles</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{users.map((teacher) => (
						<TableRow key={teacher.keycloak_id}>
							<TableCell>{`${teacher.name} ${teacher.secondName}`}</TableCell>
							<TableCell>{teacher.email}</TableCell>
							<TableCell>{teacher.phone}</TableCell>
							<TableCell>{teacher.roles.join(', ')}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}
