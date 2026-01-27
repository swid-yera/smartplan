import Link from 'next/link'

import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ui'
import { ArrowRight, Award, Bot, ShieldCheck, Upload } from 'lucide-react'

export const CreateCard = () => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Award className='h-5 w-5 text-primary' />
					Публикация награды
				</CardTitle>

				<CardDescription>Добавьте сертификат или награду для учёта в рейтинге</CardDescription>
			</CardHeader>

			<CardContent className='space-y-4 text-sm'>
				<p className='text-muted-foreground'>
					Преподаватель может опубликовать награду, сертификат или документ, подтверждающий профессиональные
					достижения.
				</p>

				<ul className='space-y-3'>
					<li className='flex gap-3'>
						<Upload className='h-4 w-4 text-muted-foreground mt-0.5' />
						<span>
							<strong>Загрузка документа:</strong> изображение или PDF сертификата с указанием типа и даты
							получения.
						</span>
					</li>

					<li className='flex gap-3'>
						<ShieldCheck className='h-4 w-4 text-muted-foreground mt-0.5' />
						<span>
							<strong>Проверка методистами:</strong> подтверждение подлинности, соответствие требованиям и
							регламенту.
						</span>
					</li>

					<li className='flex gap-3'>
						<Bot className='h-4 w-4 text-muted-foreground mt-0.5' />
						<span>
							<strong>Автоматическая проверка ИИ:</strong> анализ изображения, выявление подделок и проверка
							соответствия формату.
						</span>
					</li>
				</ul>

				<p className='text-muted-foreground'>
					После успешной проверки награда учитывается в KPI и влияет на итоговый рейтинг преподавателя.
				</p>
			</CardContent>

			<CardFooter>
				<Button asChild className='w-full' size='lg' variant='default'>
					<Link className='flex items-center gap-2' href='/kpi/create/manual'>
						Опубликовать награду
						<ArrowRight className='h-4 w-4' />
					</Link>
				</Button>
			</CardFooter>
		</Card>
	)
}
