'use client'

import { withPermission } from '@components'
import { getUILocaleSection } from '@helpers'
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@shadcn'
import { useLocaleStore } from '@store'
import { PermissionCodeEnum } from '@types'
import { Book, CheckCircle, Clock, FileText, Layers, Users, XCircle } from 'lucide-react'

import localeDictionary from './locale.json'

const Page = () => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	return (
		<section className='px-6 py-10 max-w-4xl mx-auto space-y-6'>
			<Card>
				<CardHeader>
					<CardTitle className='text-2xl font-bold'>{t.title}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className='text-base text-muted-foreground'>
						РУП — это документ, который описывает содержание учебного модуля, цели и компетенции, распределение
						часов по дисциплинам и темы занятий.
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className='text-xl font-semibold'>{t.processTitle}</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='flex items-start gap-3'>
						<Users className='h-6 w-6 text-primary' />
						<p>
							<b>Заполнение базовых данных:</b> название модуля, тип РУПа, форма обучения, учебный год, цели и
							компетенции.
						</p>
					</div>
					<div className='flex items-start gap-3'>
						<FileText className='h-6 w-6 text-primary' />
						<p>
							<b>Добавление метаданных и ресурсов:</b> контакты преподавателей, интернет-ресурсы и технические
							материалы.
						</p>
					</div>
					<div className='flex items-start gap-3'>
						<Clock className='h-6 w-6 text-primary' />
						<p>
							<b>Распределение часов:</b> добавление дисциплин и распределение теоретических и лабораторно-практических часов
							по семестрам.
						</p>
					</div>
					<div className='flex items-start gap-3'>
						<Book className='h-6 w-6 text-primary' />
						<p>
							<b>Составление содержания:</b> добавление тем занятий для каждой дисциплины. Темы должны начинаться
							с глагола по таксономии Блума.
						</p>
					</div>
					<div className='flex items-start gap-3'>
						<Layers className='h-6 w-6 text-primary' />
						<p>
							<b>Отправка на проверку:</b> после сохранения модуль отправляется методисту. Редактирование с
							помощью ИИ недоступно после отправки.
						</p>
					</div>
					<div className='flex items-start gap-3'>
						<CheckCircle className='h-6 w-6 text-green-600' />
						<XCircle className='h-6 w-6 text-red-600' />
						<p>
							<b>Проверка методистом:</b> методист может{' '}
							<Badge className='text-green-600' variant='outline'>
								подтвердить
							</Badge>{' '}
							или{' '}
							<Badge className='text-red-600' variant='outline'>
								отклонить
							</Badge>{' '}
							РУП.
						</p>
					</div>
					<div className='flex items-start gap-3'>
						<FileText className='h-6 w-6 text-primary' />
						<p>
							<b>Доступ к сгенерированному файлу:</b> файл РУПа становится доступным только после подтверждения
							методистом.
						</p>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent>
					<p className='text-sm text-muted-foreground'>
						Обратите внимание: корректность всех данных и заполнение формальных полей обязательно для успешного
						подтверждения РУПа.
					</p>
				</CardContent>
			</Card>
		</section>
	)
}

export default withPermission(Page, [
	PermissionCodeEnum.RUP_FULL,
	PermissionCodeEnum.RUP_MANAGE,
	PermissionCodeEnum.RUP_VIEW,
])
