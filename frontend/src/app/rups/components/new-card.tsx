import type { ComponentProps, FC } from 'react'

import Link from 'next/link'

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui'

export const NewCard: FC<ComponentProps<'div'>> = ({ ...props }) => {
	return (
		<Card {...props}>
			<CardHeader>
				<CardTitle>Создать новый модуль РУП</CardTitle>
				<CardDescription>
					Создайте новый модуль РУП. После создание она будет в статусе "Черновик" которую можно редактировать.
					Если статус перейден в "На согласований" его нельзя редактировать.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button asChild className='w-full' size='sm' variant='outline'>
					<Link href='/rups/create'>Создать</Link>
				</Button>
			</CardContent>
		</Card>
	)
}
