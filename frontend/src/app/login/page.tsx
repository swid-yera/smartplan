'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { Loader } from '@components'
import { getUILocaleSection } from '@helpers'
import { services } from '@services'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { AlertTriangle, LogIn, RefreshCcw } from 'lucide-react'

import localeDictionary from './locale.json'

export default function LoginErrorPage() {
	const searchParams = useSearchParams()
	const error = searchParams.get('error')

	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const { isAuthenticated, authLoading } = useAuthStore()

	if (authLoading) return <Loader type='data' />

	// if there ?error
	if (error) {
		const handleRetryLogin = () => {
			services.auth.redirectToLogout()
			// services.auth.redirectToLogin()
		}

		return (
			<div className='flex min-h-[calc(100vh-4rem)] items-center justify-center p-6'>
				<Card className='max-w-md w-full'>
					<CardHeader className='text-center space-y-2'>
						<div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10'>
							<AlertTriangle className='h-6 w-6 text-destructive' />
						</div>

						<CardTitle>{t.authErrorTitle}</CardTitle>
						<CardDescription>{t.authErrorDescription}</CardDescription>
					</CardHeader>

					<CardContent className='space-y-4 text-center'>
						<p className='text-sm text-muted-foreground'>
							{error === 'invalid_token' ? t.invalidToken : t.unexpectedError}
						</p>

						<div className='flex flex-col gap-2'>
							<Button className='flex items-center gap-2' onClick={handleRetryLogin}>
								<RefreshCcw className='h-4 w-4' />
								{t.retry}
							</Button>

							<Button asChild variant='ghost'>
								<Link href='/'>{t.goHome}</Link>
							</Button>
						</div>

						<p className='pt-4 text-xs text-muted-foreground italic'>{t.errorHint}</p>
					</CardContent>
				</Card>
			</div>
		)
	}

	// ===== CASE 2: нет error и пользователь НЕ авторизован =====
	if (!isAuthenticated) {
		return (
			<div className='flex min-h-[calc(100vh-4rem)] items-center justify-center p-6'>
				<Card className='max-w-md w-full'>
					<CardHeader className='text-center space-y-2'>
						<CardTitle>{t.requiredTitle}</CardTitle>
						<CardDescription>{t.requiredDescription}</CardDescription>
					</CardHeader>

					<CardContent className='space-y-4 text-center'>
						<Button className='w-full' onClick={() => services.auth.redirectToLogin()}>
							<LogIn className='h-4 w-4' />
							{t.login}
						</Button>

						<Button asChild className='w-full' variant='ghost'>
							<Link href='/'>{t.goHome}</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	// ===== CASE 3: авторизован и нет error =====
	// сюда пользователь вообще не должен попадать
	return null
}
