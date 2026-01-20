'use client'

import { useParams, useRouter } from 'next/navigation'

import { Loader } from '@components'
import { normalizeUserRole, prettifyPhone, userRoleButtonVariants } from '@helpers'
import { services } from '@services'
import { useQuery } from '@tanstack/react-query'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui'
import { ArrowLeft, Mail, Phone, User as UserIcon } from 'lucide-react'

export default function UserPage() {
	const router = useRouter()
	const params = useParams<{ id: string }>()

	const {
		data: user,
		isLoading,
		isError,
	} = useQuery({
		...services.user.getByIdOptions(params.id),
		enabled: !!params.id,
	})

	if (isLoading) {
		return <Loader />
	}

	if (isError || !user) {
		return (
			<div className='container mx-auto py-10 space-y-8 max-w-7xl text-center'>
				<h2 className='text-2xl font-bold'>Пользователь не найден</h2>
				<Button onClick={() => router.back()}>
					<ArrowLeft className='mr-2 h-4 w-4' /> Вернуться назад
				</Button>
			</div>
		)
	}

	return (
		<div className='container mx-auto py-10 space-y-8 max-w-4xl'>
			<Button size='sm' variant='outline' onClick={() => router.push('/users')}>
				<ArrowLeft className='mr-2 h-4 w-4' />К списку пользователей
			</Button>
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
		</div>
	)
}
