import type { FC } from 'react'

import Link from 'next/link'

import type { IUser } from '@types'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, Separator } from '@ui'
import { Calendar, User, UserSearch } from 'lucide-react'

interface IProps {
	teacher: IUser
	methodist?: IUser
	createdAt: string
	updatedAt: string
}

export const ResponsibleUsersCard: FC<IProps> = ({ teacher, methodist, createdAt, updatedAt }) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Участники</CardTitle>
			</CardHeader>
			<CardContent className='space-y-3 flex-1'>
				<div className='flex items-start gap-3'>
					<User className='mt-1 h-5 w-5 text-muted-foreground' />
					<div>
						<p className='text-sm font-medium text-muted-foreground'>Преподаватель</p>
						<Link
							className='font-medium hover:underline hover:text-primary'
							href={`/users/${teacher.keycloakId}`}
						>
							{teacher.firstName} {teacher.lastName}
						</Link>
					</div>
				</div>

				{methodist && (
					<div className='flex items-start gap-3'>
						<UserSearch className='mt-1 h-5 w-5 text-muted-foreground' />
						<div>
							<p className='text-sm font-medium text-muted-foreground'>Методист</p>
							<Link
								className='font-medium hover:underline hover:text-primary'
								href={`/users/${methodist.keycloakId}`}
							>
								{methodist.firstName} {methodist.lastName}
							</Link>
						</div>
					</div>
				)}
			</CardContent>

			<CardFooter className='flex-col items-start gap-2'>
				<Separator className='my-2' />

				<div className='flex items-center gap-2 text-sm'>
					<Calendar className='h-4 w-4' />
					<p className='text-muted-foreground'>
						Создано: <span className='text-accent-foreground'>{new Date(createdAt).toLocaleDateString()}</span>
					</p>
				</div>

				<div className='flex items-center gap-2 text-sm'>
					<Calendar className='h-4 w-4' />
					<p className='text-muted-foreground'>
						Обновлено: <span className='text-accent-foreground'>{new Date(updatedAt).toLocaleDateString()}</span>
					</p>
				</div>
			</CardFooter>
		</Card>
	)
}
