'use client'

import type { FC } from 'react'

import Link from 'next/link'

import { Card, CardContent, CardFooter, CardHeader, CardTitle, Separator } from '@shadcn'
import { useLocaleStore } from '@store'
import type { IUser, Locale } from '@types'
import { Calendar, User, UserSearch } from 'lucide-react'

import locale from './locale.json'
interface IProps {
	teacher: IUser
	methodist?: IUser
	createdAt: string
	updatedAt: string
	localeCode?: Locale
}

export const ResponsibleUsersCard: FC<IProps> = ({ teacher, methodist, createdAt, updatedAt, localeCode }) => {
	const uiLocale = useLocaleStore((state) => state.locale)
	const currentLocale = localeCode ?? uiLocale
	const t = locale[currentLocale] ?? locale.ru
	const dateLocale = currentLocale === 'kk' ? 'kk-KZ' : 'ru-RU'

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t.responsibleUsers.title}</CardTitle>
			</CardHeader>
			<CardContent className='space-y-3 flex-1'>
				<div className='flex items-start gap-3'>
					<User className='mt-1 h-5 w-5 text-muted-foreground' />
					<div>
						<p className='text-sm font-medium text-muted-foreground'>{t.responsibleUsers.teacher}</p>
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
							<p className='text-sm font-medium text-muted-foreground'>{t.responsibleUsers.methodist}</p>
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
						{t.responsibleUsers.createdAt}:{' '}
						<span className='text-accent-foreground'>{new Date(createdAt).toLocaleDateString(dateLocale)}</span>
					</p>
				</div>

				<div className='flex items-center gap-2 text-sm'>
					<Calendar className='h-4 w-4' />
					<p className='text-muted-foreground'>
						{t.responsibleUsers.updatedAt}:{' '}
						<span className='text-accent-foreground'>{new Date(updatedAt).toLocaleDateString(dateLocale)}</span>
					</p>
				</div>
			</CardFooter>
		</Card>
	)
}
