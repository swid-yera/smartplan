import type { FC } from 'react'

import Link from 'next/link'

import { Loader } from '@components'
import { getLocaleText, getUILocaleSection, normalizeUserRole, prettifyPhone, userRoleButtonVariants } from '@helpers'
import {
	Badge,
	Button,
	Card,
	CardContent,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { type IUser, type PermissionCodeEnum } from '@types'
import { Mail, Phone, User } from 'lucide-react'

import { PermissionBadge } from '../../components/badges/permission-badge'
import localeDictionary from './locale.json'

interface UsersTableProps {
	users?: IUser[]
	isLoading: boolean
	onManagePermissions?: (user: IUser) => void
}

export function UsersTable({ users = [], isLoading, onManagePermissions }: UsersTableProps) {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const isExist = users.length > 0 || !isLoading
	const showActions = !!onManagePermissions

	return (
		<div className='w-full min-w-0'>
			<div className='relative hidden w-full overflow-x-auto md:block'>
				<Table className='min-w-270'>
					<TableHeader>
						<TableRow>
							<TableHead className='max-w-75 pl-4 font-semibold'>{t.table.fullName}</TableHead>
							<TableHead className='font-semibold'>{t.table.login}</TableHead>
							<TableHead className='font-semibold'>{t.table.contact}</TableHead>
							<TableHead className='font-semibold'>{t.table.permissions}</TableHead>
							{showActions ? (
								<TableHead className='pr-4 text-right font-semibold'>{t.table.actions}</TableHead>
							) : null}
						</TableRow>
					</TableHeader>
					<TableBody>
						{isExist ? (
							users.map((user) => (
								<UserRow key={user.keycloakId} user={user} onManagePermissions={onManagePermissions} />
							))
						) : (
							<TableRow>
								<TableCell className='h-40 text-center' colSpan={showActions ? 7 : 6}>
									{isLoading ? (
										<Loader
											className='flex flex-col items-center justify-center'
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

			<div className='space-y-3 md:hidden'>
				{isExist ? (
					users.map((user) => (
						<UserMobileCard key={user.keycloakId} user={user} onManagePermissions={onManagePermissions} />
					))
				) : (
					<div className='flex min-h-40 items-center justify-center rounded-xl border bg-background px-4 text-center text-sm text-muted-foreground'>
						{isLoading ? (
							<Loader className='flex flex-col items-center justify-center' fullScreen={false} type='data' />
						) : (
							t.table.empty
						)}
					</div>
				)}
			</div>
		</div>
	)
}

interface IUserRow {
	user: IUser
	onManagePermissions?: (user: IUser) => void
}

const UserRow: FC<IUserRow> = ({ user, onManagePermissions }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const permissions = user.permissions ?? []
	const departments = (user.departments ?? []).map((department) => getLocaleText(department.name, locale))
	const departmentNames = departments.filter(Boolean)

	return (
		<TableRow key={user.keycloakId}>
			<TableCell className='font-medium'>
				<Link className='flex items-center gap-3 hover:underline' href={`/users/${user.keycloakId}`}>
					<div className='flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary'>
						<User className='h-5 w-5' />
					</div>
					<div className='min-w-0'>
						<p className='truncate font-medium capitalize'>
							{user.firstName} {user.lastName}
						</p>
						<div className='mt-1'>
							<Badge variant={userRoleButtonVariants[user.role]}>{normalizeUserRole(user.role, locale)}</Badge>
						</div>
						<div className='mt-1'>
							{departmentNames.map((departmentName) => (
								<Badge key={departmentName} variant='outline'>
									{departmentName}
								</Badge>
							))}
						</div>
					</div>
				</Link>
			</TableCell>

			<TableCell>{user.username}</TableCell>

			<TableCell>
				<div className='space-y-1'>
					<div className='flex items-center gap-2'>
						<Mail className='h-4 w-4 text-muted-foreground' />
						<span className='truncate'>{user.email || '—'}</span>
					</div>
					<div className='flex items-center gap-2'>
						<Phone className='h-4 w-4 text-muted-foreground' />
						<span>{prettifyPhone(user.phone) || '—'}</span>
					</div>
				</div>
			</TableCell>

			<TableCell className='align-top'>
				<UserPermissionsByDomain permissions={permissions} />
			</TableCell>

			{onManagePermissions ? (
				<TableCell className='text-right'>
					<Button
						className='hover:cursor-pointer'
						size='sm'
						variant='outline'
						onClick={() => onManagePermissions(user)}
					>
						{t.table.actions}
					</Button>
				</TableCell>
			) : null}
		</TableRow>
	)
}

interface IUserMobileCardProps {
	user: IUser
	onManagePermissions?: (user: IUser) => void
}

const UserMobileCard: FC<IUserMobileCardProps> = ({ user, onManagePermissions }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const permissions = user.permissions ?? []
	const departments = (user.departments ?? []).map((department) => getLocaleText(department.name, locale))
	const departmentNames = departments.filter(Boolean)

	return (
		<Card className='overflow-hidden'>
			<CardContent className='space-y-4 p-4'>
				<Link className='flex items-start gap-3 hover:underline' href={`/users/${user.keycloakId}`}>
					<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
						<User className='h-5 w-5' />
					</div>
					<div className='min-w-0 flex-1'>
						<p className='truncate font-medium capitalize'>
							{user.firstName} {user.lastName}
						</p>
						<p className='truncate text-xs text-muted-foreground'>{user.username}</p>
						<div className='mt-2 flex flex-wrap gap-1.5'>
							<Badge variant={userRoleButtonVariants[user.role]}>{normalizeUserRole(user.role, locale)}</Badge>
							{departmentNames.map((departmentName) => (
								<Badge key={departmentName} variant='outline'>
									{departmentName}
								</Badge>
							))}
						</div>
					</div>
				</Link>

				<div className='grid gap-2 rounded-lg bg-muted/20 p-3 text-sm'>
					<div className='flex items-center gap-2'>
						<Mail className='h-4 w-4 shrink-0 text-muted-foreground' />
						<span className='min-w-0 truncate'>{user.email || '—'}</span>
					</div>
					<div className='flex items-center gap-2'>
						<Phone className='h-4 w-4 shrink-0 text-muted-foreground' />
						<span className='min-w-0 truncate'>{prettifyPhone(user.phone) || '—'}</span>
					</div>
				</div>

				<div className='space-y-2'>
					<p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
						{t.table.permissions}
					</p>
					<UserPermissionsByDomain permissions={permissions} />
				</div>

				{onManagePermissions ? (
					<div className='flex justify-end'>
						<Button size='sm' variant='outline' onClick={() => onManagePermissions(user)}>
							{t.table.actions}
						</Button>
					</div>
				) : null}
			</CardContent>
		</Card>
	)
}

interface IUserPermissionsByDomainProps {
	permissions: PermissionCodeEnum[]
}

const UserPermissionsByDomain: FC<IUserPermissionsByDomainProps> = ({ permissions }) => {
	const rupPermissions = permissions.filter((permission) => String(permission).startsWith('RUP-'))
	const kpiPermissions = permissions.filter((permission) => String(permission).startsWith('KPI-'))

	return (
		<div className='space-y-1.5'>
			<div className='flex flex-wrap items-center gap-1.5'>
				{rupPermissions.length ? (
					rupPermissions.map((permission) => <PermissionBadge key={permission} permission={permission} />)
				) : (
					<Badge variant='outline'>—</Badge>
				)}
			</div>
			<div className='flex flex-wrap items-center gap-1.5'>
				{kpiPermissions.length ? (
					kpiPermissions.map((permission) => <PermissionBadge key={permission} permission={permission} />)
				) : (
					<Badge variant='outline'>—</Badge>
				)}
			</div>
		</div>
	)
}
