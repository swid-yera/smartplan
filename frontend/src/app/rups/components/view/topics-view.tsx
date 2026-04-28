'use client'

import { useState } from 'react'

import Link from 'next/link'

import { TopicTypeBadge } from '@components'
import { formatAsDash, formatHours, normalizeTopicType } from '@helpers'
import { cn } from '@lib'
import { services } from '@services'
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@shadcn'
import { useMutation } from '@tanstack/react-query'
import { type RupTypeEnum, StatusEnum, TopicTypeEnum } from '@types'
import { BookOpenText, ChevronDown, Info } from 'lucide-react'
import { toast } from 'sonner'

type Topic = {
	id: string
	name: string
	type: TopicTypeEnum
	totalHours: number
	theoryHours: number
	practiceHours: number
	individualHours: number
	srspHours?: number
	srsHours?: number
	lessonId?: string
}

type Discipline = {
	id?: string
	name: string
	totalHours: number
	topics: Topic[]
}

interface IProps {
	rupId: string
	type: RupTypeEnum
	disciplines: Discipline[]
	rupStatus: StatusEnum
}

export function TopicsView({ rupId, type: rupModuleType, disciplines, rupStatus }: IProps) {
	const total = {
		totalHours: 0,
		theoryHours: 0,
		practiceHours: 0,
		individualHours: 0,
		srspHours: 0,
		srsHours: 0,
	}

	disciplines.forEach((discipline) => {
		discipline.topics.forEach((topic) => {
			total.totalHours += topic.totalHours || 0
			total.theoryHours += topic.theoryHours || 0
			total.practiceHours += topic.practiceHours || 0
			total.individualHours += topic.individualHours || 0
			total.srspHours += topic.srspHours || 0
			total.srsHours += topic.srsHours || 0
		})
	})

	return (
		<Card>
			<CardHeader>
				<CardTitle className='text-xl'>Содержание учебной рабочей программы</CardTitle>
				<CardDescription>Темы занятий для каждой дисциплины.</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4'>
				{disciplines.length > 0 ? (
					disciplines.map((discipline) => (
						<DisciplineBlockView
							key={discipline.name}
							discipline={discipline}
							rupId={rupId}
							rupModuleType={rupModuleType}
							rupStatus={rupStatus}
						/>
					))
				) : (
					<div className='text-center text-xl text-muted-foreground py-4'>Пусто</div>
				)}

				<div className='flex justify-end items-center pt-4 pr-6 space-x-4'>
					<div className='grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-right'>
						<p className='font-medium'>Заявлено часов:</p>
						<p className='font-bold text-2xl'>{disciplines.reduce((sum, d) => sum + d.totalHours, 0)}</p>

						<p className='font-medium'>Текущие общие часы:</p>
						<div
							className={cn(
								'font-bold text-right text-2xl',
								total.totalHours !== disciplines.reduce((sum, d) => sum + d.totalHours, 0) &&
									'text-destructive',
							)}
						>
							<p>{total.totalHours}</p>
							<p className='text-xs font-normal text-muted-foreground'>
								(Теория: {total.theoryHours} / Практика: {total.practiceHours} / Индивид:{' '}
								{total.individualHours} / СРСП: {total.srspHours} / СРС: {total.srsHours})
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

function DisciplineBlockView({
	discipline,
	rupId,
	rupModuleType,
	rupStatus,
}: {
	discipline: Discipline
	rupId: string
	rupModuleType: string
	rupStatus: StatusEnum
}) {
	const [isCollapsed, setIsCollapsed] = useState(false)
	const sectionTotal = {
		totalHours: 0,
		theoryHours: 0,
		practiceHours: 0,
		individualHours: 0,
		srspHours: 0,
		srsHours: 0,
	}

	discipline.topics.forEach((topic) => {
		sectionTotal.totalHours += topic.totalHours || 0
		sectionTotal.theoryHours += topic.theoryHours || 0
		sectionTotal.practiceHours += topic.practiceHours || 0
		sectionTotal.individualHours += topic.individualHours || 0
		sectionTotal.srspHours += topic.srspHours || 0
		sectionTotal.srsHours += topic.srsHours || 0
	})

	const hasError = sectionTotal.totalHours !== discipline.totalHours

	return (
		<div className='border rounded-xl overflow-hidden'>
			<div className='flex items-center justify-between p-4 bg-muted z-10 sticky top-0'>
				<div className='font-semibold pr-4'>{discipline.name}</div>
				<Button size='sm' type='button' variant='ghost' onClick={() => setIsCollapsed((prev) => !prev)}>
					<ChevronDown className={cn('transition-transform', isCollapsed && '-rotate-90')} />
				</Button>
			</div>

			<div
				aria-hidden={isCollapsed}
				className={cn(
					'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
					isCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100',
				)}
			>
				<div className='min-h-0 overflow-hidden'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='p-4 pr-2 text-center font-semibold align-bottom' rowSpan={2}>
									№
								</TableHead>
								<TableHead className='w-full font-semibold align-bottom p-4' rowSpan={2}>
									Критерии оценки и/или темы занятий
								</TableHead>
								<TableHead
									className='p-4 font-semibold align-bottom wrap-break-words whitespace-normal text-center border-x'
									rowSpan={2}
								>
									Общее количество часов
								</TableHead>
								<TableHead className='text-center align-center font-semibold' colSpan={3}>
									В том числе
								</TableHead>
								<TableHead className='p-4 border-x align-bottom font-semibold text-center' rowSpan={2}>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger className='flex items-center justify-center w-full gap-1'>
												СРСП <Info className='w-3 h-3' />
											</TooltipTrigger>
											<TooltipContent>
												<p>Самостоятельная работа студента с преподавателем</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</TableHead>
								<TableHead className='p-4 border-r align-bottom font-semibold text-center' rowSpan={2}>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger className='flex items-center justify-center w-full gap-1'>
												СРС <Info className='w-3 h-3' />
											</TooltipTrigger>
											<TooltipContent>
												<p>Самостоятельная работа студента</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</TableHead>
								<TableHead className='p-4 font-semibold text-end align-bottom pb-4' rowSpan={2}>
									Тип занятия
								</TableHead>
							</TableRow>
							<TableRow>
								<TableHead className='p-4 font-semibold border-r text-center' colSpan={1}>
									Теория
								</TableHead>
								<TableHead className='p-4 font-semibold border-r text-center'>Практика</TableHead>
								<TableHead className='p-4 font-semibold text-center'>Индивидуальная</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{discipline.topics.length > 0 ? (
								discipline.topics.map((topic, topicIndex) => (
									<TopicRowView
										key={topicIndex}
										disciplineId={discipline.id}
										rupId={rupId}
										rupModuleType={rupModuleType}
										rupStatus={rupStatus}
										topic={topic}
										topicIndex={topicIndex}
									/>
								))
							) : (
								<TableRow>
									<TableCell className='py-12 text-center text-muted-foreground text-lg' colSpan={9}>
										Пусто
									</TableCell>
								</TableRow>
							)}
						</TableBody>

						<TableFooter>
							<TableRow>
								<TableCell className={cn('text-right font-bold', hasError && 'text-destructive')} colSpan={2}>
									Всего часов:
								</TableCell>
								<TableCell className={cn('font-bold text-center border-x', hasError && 'text-destructive')}>
									{formatHours(sectionTotal.totalHours)}
								</TableCell>
								<TableCell className='font-bold text-center border-r'>{sectionTotal.theoryHours}</TableCell>
								<TableCell className='font-bold text-center border-r'>{sectionTotal.practiceHours}</TableCell>
								<TableCell className='font-bold text-center border-r'>{sectionTotal.individualHours}</TableCell>
								<TableCell className='font-bold text-center border-r'>{sectionTotal.srspHours}</TableCell>
								<TableCell className='font-bold text-center border-r'>{sectionTotal.srsHours}</TableCell>
								<TableCell className={cn('text-right font-bold', hasError && 'text-destructive')}>
									Заявлено: {formatHours(discipline.totalHours)}
								</TableCell>
							</TableRow>
						</TableFooter>
					</Table>
				</div>
			</div>
		</div>
	)
}

const TopicRowView = ({
	topic,
	topicIndex,
	disciplineId,
	rupId,
	rupStatus,
}: {
	topic: Topic
	topicIndex: number
	disciplineId?: string
	rupId: string
	rupModuleType: string
	rupStatus: StatusEnum
}) => {
	const isApproved = rupStatus === StatusEnum.APPROVED
	const isLessonGenerated = Boolean(topic.lessonId)
	const lessonUrl = `/lessons/${topic.lessonId || topic.id}`
	const generateLessonMutation = useMutation(services.lesson.generateLessonOptions())
	const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
	const [formData, setFormData] = useState({
		name: topic.name,
		theoryHours: topic.theoryHours,
		practiceHours: topic.practiceHours,
		individualHours: topic.individualHours,
		srsHours: topic.srsHours ?? 0,
		srspHours: topic.srspHours ?? 0,
		type: topic.type,
	})

	const handleGenerateClick = () => {
		setFormData({
			name: topic.name,
			theoryHours: topic.theoryHours,
			practiceHours: topic.practiceHours,
			individualHours: topic.individualHours,
			srsHours: topic.srsHours ?? 0,
			srspHours: topic.srspHours ?? 0,
			type: topic.type,
		})
		setIsGenerateDialogOpen(true)
	}

	const onSubmit = async () => {
		if (!disciplineId) {
			toast.error('Не найден disciplineId для генерации урока')

			return
		}

		const payload = {
			rupId,
			disciplineId,
			topicId: topic.id,
			updatedTopic: {
				name: formData.name,
				type: formData.type,
				total_hours: formData.theoryHours + formData.practiceHours + formData.individualHours,
				theory_hours: formData.theoryHours,
				practice_hours: formData.practiceHours,
				individual_hours: formData.individualHours,
				srsp_hours: formData.srspHours,
				srs_hours: formData.srsHours,
			},
		}

		const toastId = `generate-lesson-${topic.id}`

		toast.loading('Генерация урока...', { id: toastId })

		try {
			const response = await generateLessonMutation.mutateAsync(payload)

			if (response.status && response.lessonId) {
				console.log('lessonId', response.lessonId)
				toast.success('Урок успешно сгенерирован', { id: toastId })
			} else {
				toast.error('Не удалось сгенерировать урок', { id: toastId })
			}
		} catch (err) {
			toast.error('Ошибка при генерации урока', {
				description: err instanceof Error ? err.message : 'Unknown error',
				id: toastId,
			})
		} finally {
			setIsGenerateDialogOpen(false)
		}
	}

	const getNonNegativeNumber = (value: string) => Math.max(0, Number(value) || 0)

	return (
		<>
			<TableRow>
				<TableCell className='align-middle font-semibold text-center p-4 pr-2'>
					<span>{topicIndex + 1}</span>
				</TableCell>
				<TableCell className='align-middle py-4 px-2 border-r whitespace-break-spaces min-w-[200px]'>
					<div className='flex justify-between items-center gap-2'>
						<span>{topic.name}</span>
						{isApproved && (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										{isLessonGenerated ? (
											<Button asChild size='icon-sm' variant='secondary'>
												<Link href={lessonUrl}>
													<BookOpenText />
												</Link>
											</Button>
										) : (
											<Button size='icon-sm' variant='default' onClick={handleGenerateClick}>
												<BookOpenText />
											</Button>
										)}
									</TooltipTrigger>
									<TooltipContent>
										<p>{isLessonGenerated ? 'Открыть урок' : 'Сгенерировать урок'}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
					</div>
				</TableCell>
				<TableCell className='align-middle text-center border-r'>{topic.totalHours}</TableCell>
				<TableCell className='align-middle text-center font-medium border-r p-4'>
					{formatAsDash(topic.theoryHours)}
				</TableCell>
				<TableCell className='align-middle text-center font-medium border-r p-4'>
					{formatAsDash(topic.practiceHours)}
				</TableCell>
				<TableCell className='align-middle text-center font-medium border-r p-4'>
					<p>{formatAsDash(topic.individualHours)}</p>
				</TableCell>
				<TableCell className='align-middle text-center font-medium border-r p-4'>
					{formatAsDash(topic.srspHours)}
				</TableCell>
				<TableCell className='align-middle text-center font-medium border-r p-4'>
					{formatAsDash(topic.srsHours)}
				</TableCell>
				<TableCell className='align-middle text-end p-4'>
					<TopicTypeBadge type={topic.type} />
				</TableCell>
			</TableRow>

			<Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Данные темы</DialogTitle>
						<DialogDescription>Отредактируйте данные перед генерацией урока.</DialogDescription>
					</DialogHeader>

					<div className='grid gap-4'>
						<div className='grid gap-2'>
							<Label htmlFor={`topic-name-${topic.id}`}>Название</Label>
							<Input
								id={`topic-name-${topic.id}`}
								value={formData.name}
								onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
							/>
						</div>

						<div className='grid grid-cols-2 gap-4'>
							<div className='grid gap-2'>
								<Label htmlFor={`topic-theory-${topic.id}`}>Теория</Label>
								<Input
									id={`topic-theory-${topic.id}`}
									min={0}
									type='number'
									value={formData.theoryHours}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, theoryHours: getNonNegativeNumber(e.target.value) }))
									}
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor={`topic-practice-${topic.id}`}>Практика</Label>
								<Input
									id={`topic-practice-${topic.id}`}
									min={0}
									type='number'
									value={formData.practiceHours}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											practiceHours: getNonNegativeNumber(e.target.value),
										}))
									}
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor={`topic-individual-${topic.id}`}>Индивидуальная</Label>
								<Input
									id={`topic-individual-${topic.id}`}
									min={0}
									type='number'
									value={formData.individualHours}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											individualHours: getNonNegativeNumber(e.target.value),
										}))
									}
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor={`topic-srsp-${topic.id}`}>СРСП</Label>
								<Input
									id={`topic-srsp-${topic.id}`}
									min={0}
									type='number'
									value={formData.srspHours}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, srspHours: getNonNegativeNumber(e.target.value) }))
									}
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor={`topic-srs-${topic.id}`}>СРС</Label>
								<Input
									id={`topic-srs-${topic.id}`}
									min={0}
									type='number'
									value={formData.srsHours}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, srsHours: getNonNegativeNumber(e.target.value) }))
									}
								/>
							</div>
							<div className='grid gap-2'>
								<Label>Тип</Label>
								<Select
									value={formData.type}
									onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value as TopicTypeEnum }))}
								>
									<SelectTrigger className='w-full'>
										<SelectValue placeholder='Выберите тип' />
									</SelectTrigger>
									<SelectContent>
										{Object.values(TopicTypeEnum).map((type) => (
											<SelectItem key={type} value={type}>
												{normalizeTopicType(type)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button variant='outline' onClick={() => setIsGenerateDialogOpen(false)}>
							Отмена
						</Button>
						<Button onClick={onSubmit}>Сгенерировать</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
