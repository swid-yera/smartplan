'use client'

import { Badge, Button, Heading } from '@ui'

export function StepHeader() {
	return (
		<div className='flex items-center justify-between'>
			<div>
				<Heading align='left' size='h2'>
					Создание нового рабочего учебного плана <Badge variant='outline'>Черновик</Badge>
				</Heading>
				<p>Заполните поля и при необходимости используйте ИИ-помощника для генерации текста</p>
			</div>

			<Button size='lg' type='submit' variant='default'>
				Дальше
			</Button>
		</div>
	)
}
