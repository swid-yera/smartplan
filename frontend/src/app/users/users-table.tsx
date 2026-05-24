import type { FC } from 'react'

import Link from 'next/link'

import { Loader } from '@components'
import { getUILocaleSection, normalizeUserRole, prettifyPhone, userRoleButtonVariants } from '@helpers'
import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shadcn'
import { useLocaleStore } from '@store'
import type { IUser } from '@types'
import { User } from 'lucide-react'

import localeDictionary from './locale.json'

interface UsersTableProps {
	users?: IUser[]
	isLoading: boolean
}

export function UsersTable({ users = [], isLoading }: UsersTableProps) {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const isExist = users.length > 0 || !isLoading

	return (
		<div className='relative w-full min-w-0 overflow-x-auto'>
			<Table className='min-w-[900px]'>
				<TableHeader>
					<TableRow>
						<TableHead className='font-semibold pl-4 max-w-[300px]'>{t.table.fullName}</TableHead>
						<TableHead className='font-semibold'>{t.table.login}</TableHead>
						<TableHead className='font-semibold'>Email</TableHead>
						<TableHead className='font-semibold'>{t.table.phone}</TableHead>
						<TableHead className='font-semibold text-right pr-4'>{t.table.role}</TableHead>
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
									t.table.empty
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
	const locale = useLocaleStore((state) => state.locale)

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
				<Badge variant={userRoleButtonVariants[user.role]}>{normalizeUserRole(user.role, locale)}</Badge>
			</TableCell>
		</TableRow>
	)
}
