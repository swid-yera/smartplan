'use client'

import { useState } from 'react'

import { TopicTypeBadge } from '@components'
import { formatAsDash, formatHours } from '@helpers'
import { cn } from '@lib'
import type { RupTypeEnum, TopicTypeEnum } from '@types'
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
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
} from '@ui'
import { ChevronDown, Info } from 'lucide-react'

type Topic = {
	name: string
	type: TopicTypeEnum
	totalHours: number
	theoryHours: number
	practiceHours: number
	individualHours: number
	srspHours?: number
	srsHours?: number
}

type Discipline = {
	name: string
	totalHours: number
	topics: Topic[]
}

interface IProps {
	type: RupTypeEnum
	disciplines: Discipline[]
}

export function TopicsView({ type: rupModuleType, disciplines }: IProps) {
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
						<DisciplineBlockView key={discipline.name} discipline={discipline} rupModuleType={rupModuleType} />
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

function DisciplineBlockView({ discipline, rupModuleType }: { discipline: Discipline; rupModuleType: string }) {
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
				<Button size='sm' type='button' variant='ghost' onClick={() => setIsCollapsed(!isCollapsed)}>
					<ChevronDown className={cn('transition-transform', isCollapsed && '-rotate-90')} />
				</Button>
			</div>

			{!isCollapsed && (
				<div>
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
										rupModuleType={rupModuleType}
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
			)}
		</div>
	)
}

const TopicRowView = ({ topic, topicIndex }: { topic: Topic; topicIndex: number; rupModuleType: string }) => {
	return (
		<TableRow>
			<TableCell className='align-middle font-semibold text-center p-4 pr-2'>
				<span>{topicIndex + 1}</span>
			</TableCell>
			<TableCell className='align-middle py-4 px-2 border-r whitespace-break-spaces min-w-[200px]'>
				{topic.name}
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
	)
}
