'use client'

import { useState } from 'react'

import { Loader } from '@components'
import { normalizeUserRole, prettifyPhone, userRoleButtonVariants } from '@helpers'
import { services } from '@services'
import { useQuery } from '@tanstack/react-query'
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@ui'
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, User } from 'lucide-react'

export default function TeachersPage() {
	const { data: users = [], isLoading } = useQuery(services.user.getAllOptions())

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

	if (isLoading) {
		return <Loader />
	}

	return (
		<div className='container mx-auto py-10 space-y-8 max-w-7xl'>
			<div className='flex flex-col space-y-2'>
				<h1 className='text-3xl font-bold tracking-tight'>Преподаватели</h1>
				<p className='text-muted-foreground'>
					Управляйте списком преподавателей, просматривайте их контактные данные и роли.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Список преподавателей</CardTitle>
					<CardDescription>
						Всего преподавателей: {users.length}. Используйте поиск для фильтрации.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='flex flex-col md:flex-row items-center justify-between mb-6 gap-4'>
						<div className='flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto'>
							<div className='relative w-full sm:w-72'>
								<Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
								<Input
									className='pl-8'
									placeholder='Поиск по имени или email...'
									value={search}
									onChange={(e) => {
										setSearch(e.target.value)
										setCurrentPage(1)
									}}
								/>
							</div>
							<Select
								value={selectedRole}
								onValueChange={(value) => {
									setSelectedRole(value)
									setCurrentPage(1)
								}}
							>
								<SelectTrigger className='w-full sm:w-[180px]'>
									<SelectValue placeholder='Выберите роль' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>Все роли</SelectItem>
									<SelectItem value='TEACHER'>Преподаватель</SelectItem>
									<SelectItem value='ADMIN'>Администратор</SelectItem>
									<SelectItem value='METHODIST'>Методист</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<Button className='w-full md:w-auto' size='sm' variant='outline' onClick={toggleSort}>
							Сортировка
							<ArrowUpDown className='ml-2 h-4 w-4' />
						</Button>
					</div>

					<div className='rounded-md border'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className='font-semibold pl-4 max-w-[300px]'>ФИО</TableHead>
									<TableHead className='font-semibold'>Логин</TableHead>
									<TableHead className='font-semibold'>Email</TableHead>
									<TableHead className='font-semibold'>Телефон</TableHead>
									<TableHead className='font-semibold text-right pr-4'>Роль</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedUsers.length > 0 ? (
									paginatedUsers.map((teacher) => (
										<TableRow key={teacher.keycloakId}>
											<TableCell className='font-medium'>
												<div className='flex items-center gap-3'>
													<div className='flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary'>
														<User className='h-5 w-5' />
													</div>
													<span className='capitalize'>
														{teacher.firstName} {teacher.lastName}
													</span>
												</div>
											</TableCell>
											<TableCell>{teacher.userName}</TableCell>
											<TableCell>{teacher.email}</TableCell>
											<TableCell>{prettifyPhone(teacher.phone)}</TableCell>
											<TableCell className='text-right'>
												<Badge variant={userRoleButtonVariants[teacher.role]}>
													{normalizeUserRole(teacher.role)}
												</Badge>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell className='h-24 text-center' colSpan={4}>
											Ничего не найдено.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>

					<div className='flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 py-4'>
						<div className='flex items-center space-x-2 text-sm text-muted-foreground'>
							<p className='text-sm text-muted-foreground'>Строк на странице</p>
							<Select
								value={`${itemsPerPage}`}
								onValueChange={(value) => {
									setItemsPerPage(Number(value))
									setCurrentPage(1)
								}}
							>
								<SelectTrigger className='h-8 w-[70px]'>
									<SelectValue placeholder={itemsPerPage} />
								</SelectTrigger>
								<SelectContent side='top'>
									{[10, 20, 50].map((pageSize) => (
										<SelectItem key={pageSize} value={`${pageSize}`}>
											{pageSize}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className='flex items-center space-x-2'>
							<div className='text-sm text-muted-foreground mr-2'>
								Страница {currentPage} из {totalPages || 1}
							</div>
							<Button
								disabled={currentPage === 1}
								size='sm'
								variant='outline'
								onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
							>
								<ChevronLeft className='h-4 w-4' />
							</Button>
							<Button
								disabled={currentPage === totalPages || totalPages === 0}
								size='sm'
								variant='outline'
								onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
							>
								<ChevronRight className='h-4 w-4' />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
