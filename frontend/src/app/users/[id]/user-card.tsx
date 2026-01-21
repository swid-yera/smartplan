import type { FC } from 'react'

import { normalizeUserRole, prettifyPhone, userRoleButtonVariants } from '@helpers'
import type { IUser } from '@types'
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui'
import { Mail, Phone, UserIcon } from 'lucide-react'

interface IUserMainProps {
	user: IUser
}

export const UserCard: FC<IUserMainProps> = ({ user }) => {
	return (
		<Card>
			<CardHeader className='flex items-center gap-4'>
				<div className='flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary'>
					<UserIcon className='h-8 w-8' />
				</div>
				<div className='flex-1'>
					<CardTitle className='text-2xl capitalize'>
						{user.firstName} {user.lastName}
					</CardTitle>
					<CardDescription>
						<Badge variant={userRoleButtonVariants[user.role]}>{normalizeUserRole(user.role)}</Badge>
					</CardDescription>
				</div>

				<Badge variant='outline'>{user.keycloakId}</Badge>
			</CardHeader>

			<CardContent className='space-y-6'>
				<div className='grid gap-4 md:grid-cols-2'>
					<div className='space-y-1'>
						<p className='text-sm font-medium text-muted-foreground'>Имя</p>
						<p className='flex items-center gap-2'>{user.firstName}</p>
					</div>

					<div className='space-y-1'>
						<p className='text-sm font-medium text-muted-foreground'>Фамилия</p>
						<p className=''>{user.lastName}</p>
					</div>

					<div className='space-y-1'>
						<p className='text-sm font-medium text-muted-foreground'>Логин</p>
						<p>{user.userName}</p>
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
						<p className='text-sm font-medium text-muted-foreground'>Телефон</p>
						<p className='flex items-center gap-2'>
							{user.phone && (
								<>
									<Phone className='h-4 w-4 text-muted-foreground' />
									{prettifyPhone(user.phone)}
								</>
							)}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
