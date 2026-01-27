'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { services } from '@services'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

export default function LoginErrorPage() {
	const searchParams = useSearchParams()
	const error = searchParams.get('error')

	const handleRetryLogin = () => {
		services.auth.redirectToLogout()
		services.auth.redirectToLogin()
	}

	return (
		<div className='flex min-h-[calc(100vh-4rem)] items-center justify-center p-6'>
			<Card className='max-w-md w-full'>
				<CardHeader className='text-center space-y-2'>
					<div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10'>
						<AlertTriangle className='h-6 w-6 text-destructive' />
					</div>

					<CardTitle>Ошибка авторизации</CardTitle>
					<CardDescription>Что-то пошло не так при входе в систему</CardDescription>
				</CardHeader>

				<CardContent className='space-y-4 text-center'>
					<p className='text-sm text-muted-foreground'>
						{error === 'invalid_token'
							? 'Сессия устарела или токен авторизации недействителен. Такое иногда случается — ничего страшного.'
							: 'Произошла непредвиденная ошибка при попытке авторизации.'}
					</p>

					<div className='flex flex-col gap-2'>
						<Button className='flex items-center gap-2 hover:cursor-pointer' onClick={handleRetryLogin}>
							<RefreshCcw className='h-4 w-4' />
							Попробовать снова
						</Button>

						<Button asChild variant='ghost'>
							<Link href='/'>Вернуться на главную</Link>
						</Button>
					</div>

					<p className='pt-4 text-xs text-muted-foreground italic'>
						Если ошибка повторяется — попробуйте обновить страницу или войти позже. Мы уже смотрим, что могло
						пойти не так 👀
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
