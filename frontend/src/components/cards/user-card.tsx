import type { FC } from 'react'

import {
	getLocaleText,
	getUILocaleSection,
	normalizeTotalPoints,
	normalizeUserRole,
	prettifyPhone,
	userRoleButtonVariants,
} from '@helpers'
import { cn } from '@lib'
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { type IUser, RoleEnum } from '@types'
import { Mail, Phone, UserIcon } from 'lucide-react'

import localeDictionary from './locale.json'
import { ViolationBadge } from '../badges/violation-badge'

interface IUserMainProps {
	user: IUser
	className?: string
	showViolation?: boolean
}

export const UserCard: FC<IUserMainProps> = ({ user, className, showViolation = true }) => {
	const locale = useLocaleStore((state) => state.locale)
	const me = useAuthStore((state) => state.user)
	const t = getUILocaleSection(localeDictionary, locale).userCard
	const isTeacher = me?.role !== RoleEnum.TEACHER
	const departmentNames = (user.departments ?? user.deparments ?? [])
		.map((department) => getLocaleText(department.name, locale))
		.filter(Boolean)
		.join(', ')

	return (
		<Card className={cn(className)}>
			<CardHeader className='flex items-center gap-4'>
				<div className='flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary'>
					<UserIcon className='h-8 w-8' />
				</div>
				<div className='flex-1'>
					<CardTitle className='text-2xl capitalize'>
						{user.firstName} {user.lastName}
					</CardTitle>
					<CardDescription className='flex flex-wrap items-center gap-2'>
						<Badge variant={userRoleButtonVariants[user.role]}>{normalizeUserRole(user.role, locale)}</Badge>
						{departmentNames ? <Badge variant='outline'>{departmentNames}</Badge> : null}
					</CardDescription>
				</div>

				<Badge
					className='opacity-0 relative overflow-hidden px-3 py-1 font-mono tracking-wide hover:opacity-100 transition-opacity duration-300 ease-out'
					variant='outline'
				>
					{user.keycloakId}
				</Badge>
			</CardHeader>

			<CardContent className='space-y-6'>
				<div className='grid gap-4 md:grid-cols-2'>
					<div className='space-y-1'>
						<p className='text-sm font-medium text-muted-foreground'>{t.firstName}</p>
						<p className='flex items-center gap-2'>{user.firstName}</p>
					</div>

					<div className='space-y-1'>
						<p className='text-sm font-medium text-muted-foreground'>{t.lastName}</p>
						<p className=''>{user.lastName}</p>
					</div>

					<div className='space-y-1'>
						<p className='text-sm font-medium text-muted-foreground'>{t.username}</p>
						<p>{user.username}</p>
					</div>

					<div className='space-y-1'>
						<p className='text-sm font-medium text-muted-foreground'>Email</p>
						<p className='flex items-center gap-2'>
							{user.email && (
								<>
									<Mail className='h-4 w-4 text-muted-foreground' />
									{user.email}
								</>
							)}
						</p>
					</div>

					<div className='space-y-1'>
						<p className='text-sm font-medium text-muted-foreground'>{t.phone}</p>
						<p className='flex items-center gap-2'>
							{user.phone && (
								<>
									<Phone className='h-4 w-4 text-muted-foreground' />
									{prettifyPhone(user.phone)}
								</>
							)}
						</p>
					</div>

					{isTeacher && (
						<div className='space-y-1'>
							<p className='text-sm font-medium text-muted-foreground'>{t.totalPoints}</p>
							<p className='text-primary'>{normalizeTotalPoints(user.totalPoints ?? 0, locale)}</p>
						</div>
					)}
				</div>

				{showViolation && <ViolationBadge user={user} />}
			</CardContent>
		</Card>
	)
}
