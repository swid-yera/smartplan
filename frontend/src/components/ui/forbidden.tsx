import type { FC } from 'react'

import Link from 'next/link'

import { Button } from '@shadcn'
import { Home, MoveLeft, ShieldAlert } from 'lucide-react'

export const Forbidden: FC = () => {
	return (
		<div className='container flex flex-1 flex-col items-center justify-center gap-8 py-12 text-center'>
			{/* Иконка с анимацией */}
			<div className='relative flex items-center justify-center'>
				{/* Мягкое свечение сзади */}
				<div className='absolute inset-0 animate-pulse rounded-full bg-destructive/10 opacity-75 duration-2000' />
				<div className='relative rounded-full bg-muted/30 p-8 ring-1 ring-border backdrop-blur-sm'>
					<ShieldAlert className='h-20 w-20 text-destructive ' />
				</div>
			</div>

			{/* Текстовый блок */}
			<div className='space-y-4 max-w-[600px]'>
				<h1 className='text-8xl font-black tracking-tighter text-foreground select-none'>403</h1>
				<h2 className='text-3xl font-bold tracking-tight'>Доступ ограничен</h2>
				<p className='text-muted-foreground text-lg leading-relaxed'>
					У вас недостаточно прав для просмотра этой страницы. Если вы считаете, что это ошибка, обратитесь к
					администратору или попробуйте войти под другой учетной записью.
				</p>
			</div>

			{/* Кнопки действий */}
			<div className='flex flex-col sm:flex-row gap-4 min-w-[200px]'>
				<Button asChild className='gap-2' size='lg'>
					<Link href='/'>
						<Home className='h-4 w-4' />
						На главную
					</Link>
				</Button>

				<Button asChild className='gap-2' size='lg' variant='outline'>
					<Link href='javascript:history.back()'>
						<MoveLeft className='h-4 w-4' />
						Вернуться назад
					</Link>
				</Button>
			</div>

			{/* Декоративный элемент (опционально) */}
			<div className='mt-8 flex items-center gap-2 text-xs text-muted-foreground/50 uppercase tracking-widest'>
				<span className='h-px w-8 bg-border' />
				Access Denied
				<span className='h-px w-8 bg-border' />
			</div>
		</div>
	)
}
