import type { ComponentProps, FC } from 'react'

import Link from 'next/link'

import { getUILocaleSection } from '@helpers'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shadcn'
import { useLocaleStore } from '@store'

import localeDictionary from './locale.json'

export const NewCard: FC<ComponentProps<'div'>> = ({ ...props }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	return (
		<Card {...props}>
			<CardHeader>
				<CardTitle>{t.newRupTitle}</CardTitle>
				<CardDescription>
					Создайте новый модуль РУП. После создание она будет в статусе "Черновик" которую можно редактировать.
					Если статус перейден в "На проверке" его нельзя редактировать.
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
