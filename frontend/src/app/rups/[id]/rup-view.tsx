import type { FC } from 'react'

import Link from 'next/link'

import { statusLabels, statusVariants } from '@helpers'
import type { IRupModule } from '@types'
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Heading,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@ui'
import { ArrowLeft } from 'lucide-react'

interface RupViewProps {
	data: IRupModule
}

const RupView: FC<RupViewProps> = ({ data }) => {
	return (
		<div className='w-full mx-auto px-4 py-6 space-y-4'>
			{/* Header */}
			<div className='flex items-center gap-4'>
				<Button asChild size='icon' type='button' variant='outline'>
					<Link href='/rups'>
						<ArrowLeft />
					</Link>
				</Button>
				<div className='w-full'>
					<Heading align='left' size='h1'>
						{data.title || 'Рабочий учебный план'}{' '}
						<Badge variant={statusVariants[data.status] ?? 'outline'}>{statusLabels[data.status]}</Badge>
					</Heading>
					<p className='text-muted-foreground'>Просмотр данных рабочего учебного плана.</p>
				</div>
			</div>

			{/* Content */}
			<div className='w-full space-y-5'>
				{/* Basic Data & Group */}
				<div className='grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)]'>
					<Card>
						<CardHeader>
							<CardTitle>Основные данные</CardTitle>
						</CardHeader>
						<CardContent className='space-y-2 text-sm'>
							<p>
								<span className='font-medium text-muted-foreground'>Тип модуля:</span> {data.type}
							</p>
							<p>
								<span className='font-medium text-muted-foreground'>Форма обучения:</span> {data.studyForm}
							</p>
							<p>
								<span className='font-medium text-muted-foreground'>Год:</span> {data.year}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Группа</CardTitle>
						</CardHeader>
						<CardContent className='space-y-2 text-sm'>
							<p>
								<span className='font-medium text-muted-foreground'>Специальность:</span>{' '}
								{data.group?.specialty ?? '—'}
							</p>
							<p>
								<span className='font-medium text-muted-foreground'>Квалификация:</span>{' '}
								{data.group?.qualification ?? '—'}
							</p>
							<p>
								<span className='font-medium text-muted-foreground'>Группа:</span> {data.group?.name ?? '—'}
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Goals & Exploration Note */}
				<div className='grid gap-4 md:grid-cols-2'>
					<Card>
						<CardHeader>
							<CardTitle>Цели и реквизиты</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4 text-sm'>
							<div>
								<h4 className='font-medium'>Цели освоения модуля</h4>
								<p className='text-muted-foreground'>{data.goals}</p>
							</div>
							<div>
								<h4 className='font-medium'>Пререквизиты</h4>
								<p className='text-muted-foreground'>{data.prerequisites}</p>
							</div>
							<div>
								<h4 className='font-medium'>Постреквизиты</h4>
								<p className='text-muted-foreground'>{data.postrequisites}</p>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Пояснительная записка</CardTitle>
						</CardHeader>
						<CardContent className='text-sm'>
							<p className='text-muted-foreground whitespace-pre-wrap'>{data.explorationNote}</p>
						</CardContent>
					</Card>
				</div>

				{/* Contacts */}
				<Card>
					<CardHeader>
						<CardTitle>Контакты</CardTitle>
						<CardDescription>Контактные данные ответственных лиц.</CardDescription>
					</CardHeader>
					<CardContent>
						<ul className='space-y-2 text-sm'>
							{data.contacts.map((contact) => (
								<li
									key={contact.keycloak_id}
									className='flex items-center justify-between p-2 border rounded-md'
								>
									<span>
										{contact.name} {contact.secondName}
									</span>
									<span className='text-muted-foreground'>{contact.email}</span>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>

				{/* Resources */}
				<div className='grid md:grid-cols-2 gap-4'>
					<Card>
						<CardHeader>
							<CardTitle>Учебно-методическое оснащение, справочная литература/интернет-ресурсы</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className='list-disc list-inside space-y-1 text-sm'>
								{data.internetResources.map((res, i) => (
									<li key={i}>{res.value}</li>
								))}
							</ul>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Технические средства и материалы</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className='list-disc list-inside space-y-1 text-sm'>
								{data.technicalResources.map((res, i) => (
									<li key={i}>{res.value}</li>
								))}
							</ul>
						</CardContent>
					</Card>
				</div>

				{/* Disciplines and Topics */}
				<div className='space-y-4'>
					<Heading align='left' size='h2'>
						Дисциплины и темы
					</Heading>
					{data.disciplines?.length > 0 ? (
						data.disciplines.map((discipline, index) => (
							<Card key={index}>
								<CardHeader>
									<CardTitle>
										{discipline.code} — {discipline.name}
									</CardTitle>
									<CardDescription>Общее количество часов: {discipline.totalHours}</CardDescription>
								</CardHeader>
								<CardContent>
									<div className='border rounded-md'>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className='w-[50px]'>№</TableHead>
													<TableHead>Наименование темы</TableHead>
													<TableHead>Тип занятия</TableHead>
													<TableHead className='text-right'>Часы</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{discipline.topics?.map((topic, tIndex) => (
													<TableRow key={tIndex}>
														<TableCell>{tIndex + 1}</TableCell>
														<TableCell>{topic.name}</TableCell>
														<TableCell>{topic.type}</TableCell>
														<TableCell className='text-right'>{topic.totalHours}</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								</CardContent>
							</Card>
						))
					) : (
						<p className='text-muted-foreground'>Дисциплины не добавлены.</p>
					)}
				</div>
			</div>
		</div>
	)
}

export default RupView
