'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

import { Loader, PageTitle, StatusBadge } from '@components'
import { services } from '@services'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, CardContent, CardHeader, CardTitle, Separator } from '@ui'
import { Calendar, Download, FileText, Link as LinkIcon, User } from 'lucide-react'

const Page = () => {
	const { id } = useParams()
	const router = useRouter()

	const { data: award, isLoading } = useQuery({
		...services.award.getByIdOptions(id as string),
		enabled: !!id,
	})

	if (isLoading) return <Loader />

	if (!award) {
		return (
			<div className='flex flex-col items-center justify-center h-[50vh] space-y-4'>
				<h2 className='text-xl font-semibold'>Награда не найдена</h2>
				<Button onClick={() => router.back()}>Вернуться назад</Button>
			</div>
		)
	}

	console.log(award)

	return (
		<div className='space-y-6 p-6 w-full'>
			<PageTitle backHref={`/kpi/${id}`} description={`обновлено: ${award.updatedAt}`}>
				Детали достижения
			</PageTitle>

			<div className='mt-6 grid gap-6 md:grid-cols-3'>
				{/* Основная информация */}
				<Card className='md:col-span-2'>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-xl font-bold'>{award.variant.name}</CardTitle>
						<StatusBadge status={award.status} />
					</CardHeader>
					<CardContent className='space-y-4 pt-4'>
						<div className='grid gap-4 sm:grid-cols-2'>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Тип критерия</p>
								<p className='text-base'>{award.type.name}</p>
							</div>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Критерий</p>
								<p className='text-base'>{award.criteria.name}</p>
							</div>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Метод оценки</p>
								<p className='text-base'>{award.criteria.method}</p>
							</div>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Начисленные баллы</p>
								<p className='text-2xl font-bold text-primary'>{award.totalPoints}</p>
							</div>
						</div>

						{award.reason && (
							<div className='rounded-md bg-destructive/10 p-4 text-sm text-destructive'>
								<p className='font-semibold'>Причина отклонения:</p>
								<p>{award.reason}</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Участники */}
				<Card>
					<CardHeader>
						<CardTitle>Участники</CardTitle>
					</CardHeader>
					<CardContent className='space-y-6'>
						<div className='flex items-start gap-3'>
							<User className='mt-1 h-5 w-5 text-muted-foreground' />
							<div>
								<p className='text-sm font-medium text-muted-foreground'>Преподаватель</p>
								<Link
									className='font-medium hover:underline hover:text-primary'
									href={`/users/${award.teacher.keycloakId}`}
								>
									{award.teacher.firstName} {award.teacher.lastName}
								</Link>
							</div>
						</div>

						{award.methodist && (
							<>
								<Separator />
								<div className='flex items-start gap-3'>
									<User className='mt-1 h-5 w-5 text-muted-foreground' />
									<div>
										<p className='text-sm font-medium text-muted-foreground'>Методист</p>
										<Link
											className='font-medium hover:underline hover:text-primary'
											href={`/users/${award.methodist.keycloakId}`}
										>
											{award.methodist.firstName} {award.methodist.lastName}
										</Link>
									</div>
								</div>
							</>
						)}
					</CardContent>
				</Card>

				{/* Описание и файлы */}
				<Card className='md:col-span-3'>
					<CardHeader>
						<CardTitle>Материалы и описание</CardTitle>
					</CardHeader>
					<CardContent className='space-y-6'>
						<div>
							<h3 className='mb-2 font-semibold'>Описание</h3>
							<div className='rounded-md bg-muted/50 p-4 text-sm whitespace-pre-wrap'>
								{award.text || 'Описание отсутствует'}
							</div>
						</div>

						<div className='grid gap-6 md:grid-cols-2'>
							{award.links && award.links.length > 0 && (
								<div>
									<h3 className='mb-2 font-semibold flex items-center gap-2'>
										<LinkIcon className='h-4 w-4' /> Ссылки
									</h3>
									<ul className='space-y-2'>
										{award.links.map((link, idx) => (
											<li key={idx} className='text-sm'>
												<a
													className='text-primary hover:underline break-all'
													href={link}
													rel='noopener noreferrer'
													target='_blank'
												>
													{link}
												</a>
											</li>
										))}
									</ul>
								</div>
							)}

							{award.files && award.files.length > 0 && (
								<div>
									<h3 className='mb-2 font-semibold flex items-center gap-2'>
										<FileText className='h-4 w-4' /> Файлы
									</h3>
									<div className='space-y-4'>
										{award.files.map((file, idx) => {
											const isImage = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(file)

											if (isImage) {
												return (
													<div key={idx} className='space-y-2 max-w-md'>
														<a
															className='block rounded-md border overflow-hidden hover:opacity-90 transition-opacity'
															href={file}
															rel='noopener noreferrer'
															target='_blank'
														>
															<img
																alt={`File ${idx + 1}`}
																className='w-full h-auto object-contain'
																src={file}
															/>
														</a>
														<Button asChild size='sm' variant='outline'>
															<a download href={file} rel='noopener noreferrer' target='_blank'>
																<Download className='mr-2 h-4 w-4' />
																Скачать
															</a>
														</Button>
													</div>
												)
											}

											return (
												<div key={idx} className='text-sm flex items-center gap-2'>
													<FileText className='h-4 w-4 text-muted-foreground' />
													<a
														download
														className='truncate max-w-[300px] hover:underline text-primary'
														href={file}
														rel='noopener noreferrer'
														target='_blank'
													>
														{file}
													</a>
												</div>
											)
										})}
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Даты */}
				<Card className='md:col-span-3'>
					<CardContent className='flex flex-wrap gap-6 py-4 text-sm text-muted-foreground'>
						<div className='flex items-center gap-2'>
							<Calendar className='h-4 w-4' />
							<span>Создано: {new Date(award.createdAt).toLocaleDateString()}</span>
						</div>
						<div className='flex items-center gap-2'>
							<Calendar className='h-4 w-4' />
							<span>Обновлено: {new Date(award.updatedAt).toLocaleDateString()}</span>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

export default Page
