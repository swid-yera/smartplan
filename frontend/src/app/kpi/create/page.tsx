'use client'

import type { NextPage } from 'next'
import Link from 'next/link'

import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ui'
import { Check, PenTool, Sparkles } from 'lucide-react'

const Page: NextPage = () => {
	return (
		<section className='p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen flex flex-col justify-center'>
			<div className='grid grid-cols-1 gap-6 md:grid-cols-2 mb-20'>
				<Card className='flex h-full flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg'>
					<CardHeader className='flex'>
						<div className='mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
							<PenTool className='h-6 w-6 text-primary' />
						</div>
						<div className='pt-2'>
							<CardTitle>Вручную</CardTitle>
							<CardDescription>Создайте KPI самостоятельно, заполнив все необходимые поля.</CardDescription>
						</div>
					</CardHeader>
					<CardContent className='grid gap-4'>
						<div className='flex items-center space-x-2'>
							<div className='bg-primary rounded-full p-1.5'>
								<Check className='h-4.5 w-4.5 text-background' />
							</div>
							<span className='text-sm text-muted-foreground'>Полный контроль данных</span>
						</div>
						<div className='flex items-center space-x-2'>
							<div className='bg-primary rounded-full p-1.5'>
								<Check className='h-4.5 w-4.5 text-background' />
							</div>
							<span className='text-sm text-muted-foreground'>Пошаговое заполнение</span>
						</div>
						<div className='flex items-center space-x-2'>
							<div className='bg-primary rounded-full p-1.5'>
								<Check className='h-4.5 w-4.5 text-background' />
							</div>
							<span className='text-sm text-muted-foreground'>Для нестандартных случаев</span>
						</div>
					</CardContent>
					<CardFooter className='mt-10'>
						<Button asChild className='w-full' variant='outline'>
							<Link href='/kpi/create/manual'>Выбрать</Link>
						</Button>
					</CardFooter>
				</Card>

				<Card className='relative flex h-full flex-col justify-between border-primary/40 shadow-md transition-all hover:-translate-y-1 hover:border-primary hover:shadow-xl'>
					<div className='absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-sm'>
						Рекомендуем
					</div>
					<CardHeader className='flex'>
						<div className='mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10'>
							<Sparkles className='h-6 w-6 text-secondary' />
						</div>
						<div className='pt-2'>
							<CardTitle>С помощью ИИ</CardTitle>
							<CardDescription>Сгенерируйте KPI автоматически на основе описания вашей цели.</CardDescription>
						</div>
					</CardHeader>
					<CardContent className='grid gap-4'>
						<div className='flex items-center space-x-2'>
							<div className='bg-secondary rounded-full p-1.5'>
								<Check className='h-4.5 w-4.5 text-background' />
							</div>
							<span className='text-sm text-muted-foreground'>Быстрое распознавание</span>
						</div>
						<div className='flex items-center space-x-2'>
							<div className='bg-secondary rounded-full p-1.5'>
								<Check className='h-4.5 w-4.5 text-background' />
							</div>
							<span className='text-sm text-muted-foreground'>Минимум ручного ввода</span>
						</div>
						<div className='flex items-center space-x-2'>
							<div className='bg-secondary rounded-full p-1.5'>
								<Check className='h-4.5 w-4.5 text-background' />
							</div>
							<span className='text-sm text-muted-foreground'>Умная категоризация</span>
						</div>
					</CardContent>
					<CardFooter className='mt-10'>
						<Button asChild className='w-full' variant='secondary'>
							<Link href='/kpi/create/ai'>Выбрать</Link>
						</Button>
					</CardFooter>
				</Card>
			</div>
		</section>
	)
}

export default Page
