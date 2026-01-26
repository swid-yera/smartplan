import type { FC } from 'react'

import Link from 'next/link'

import { Loader } from '@components'
import { normalizeUserRole, prettifyPhone, userRoleButtonVariants } from '@helpers'
import type { IUser } from '@types'
import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ui'
import { User } from 'lucide-react'

interface UsersTableProps {
	users?: IUser[]
	isLoading: boolean
}

export function UsersTable({ users = [], isLoading }: UsersTableProps) {
	const isExist = users.length > 0 || !isLoading

	return (
		<div className='relative w-full min-w-0 overflow-x-auto'>
			<Table className='min-w-[900px]'>
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
					{isExist ? (
						users.map((user) => <UserRow key={user.keycloakId} user={user} />)
					) : (
						<TableRow>
							<TableCell className='h-40 text-center' colSpan={5}>
								{isLoading ? (
									<Loader
										className='flex flex-col justify-center items-center'
										fullScreen={false}
										type='data'
									/>
								) : (
									'Ничего не найдено.'
								)}
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	)
}

interface IUserRow {
	user: IUser
}

const UserRow: FC<IUserRow> = ({ user }) => {
	return (
		<TableRow key={user.keycloakId}>
			<TableCell className='font-medium'>
				<Link className='hover:underline flex items-center gap-3' href={`/users/${user.keycloakId}`}>
					<div className='flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary'>
						<User className='h-5 w-5' />
					</div>
					<span className='capitalize'>
						{user.firstName} {user.lastName}
					</span>
				</Link>
			</TableCell>

			<TableCell>{user.username}</TableCell>
			<TableCell>{user.email}</TableCell>
			<TableCell>{prettifyPhone(user.phone)}</TableCell>

			<TableCell className='text-right'>
				<Badge variant={userRoleButtonVariants[user.role]}>{normalizeUserRole(user.role)}</Badge>
			</TableCell>
		</TableRow>
	)
}
