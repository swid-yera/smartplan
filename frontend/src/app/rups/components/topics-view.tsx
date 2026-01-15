import { formatHours } from '@helpers'
import { cn } from '@lib'
import { TopicTypeEnum } from '@types'
import {
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
import { Info } from 'lucide-react'

type Topic = {
	name: string
	type: string
	totalHours: number
	theoryHours: number
	practiceHours: number
	individualHours: number
	srspHours?: number
	srsHours?: number
}

type Discipline = {
	code: string
	name: string
	totalHours: number
	topics: Topic[]
}

interface TopicsCardViewProps {
	type: string
	disciplines: Discipline[]
}

export function TopicsCardView({ type: rupModuleType, disciplines }: TopicsCardViewProps) {
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
				<CardTitle>Содержание учебной рабочей программы</CardTitle>
				<CardDescription>Темы занятий для каждой дисциплины.</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4'>
				{disciplines.map((discipline) => (
					<DisciplineBlockView key={discipline.code} discipline={discipline} rupModuleType={rupModuleType} />
				))}
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
		<div className='border rounded-lg rounded-t-none'>
			{/* Discipline Header */}
			<div className='flex items-center p-4 bg-accent z-10 sticky top-0'>
				<div className='font-semibold pr-4'>{discipline.code}</div>
				<div className='flex-1 font-medium text-left'>{discipline.name}</div>
			</div>

			{/* Topics Table */}
			<div className='p-4'>
				<Table>
					<TableHeader>
						<TableRow className='*:p-2'>
							<TableHead className='w-12 text-center'>№</TableHead>
							<TableHead>Темы занятий</TableHead>
							<TableHead className='w-20 text-center'>Всего</TableHead>
							<TableHead className='w-20 text-center'>Теория</TableHead>
							<TableHead className='w-20 text-center'>Практика</TableHead>
							<TableHead className='w-20 text-center'>Индивидуальная</TableHead>
							<TableHead className='w-20 text-center'>
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
							<TableHead className='w-20 text-center'>
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
							<TableHead className='w-48 text-end'>Тип занятия</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						{discipline.topics.map((topic, topicIndex) => (
							<TopicRowView
								key={topicIndex}
								rupModuleType={rupModuleType}
								topic={topic}
								topicIndex={topicIndex}
							/>
						))}
					</TableBody>

					<TableFooter>
						<TableRow>
							<TableCell className={cn('text-right font-bold', hasError && 'text-destructive')} colSpan={2}>
								Итого по разделу:
							</TableCell>
							<TableCell className={cn('font-bold text-center', hasError && 'text-destructive')}>
								{formatHours(sectionTotal.totalHours)}
							</TableCell>
							<TableCell className='font-bold text-center'>{sectionTotal.theoryHours}ч</TableCell>
							<TableCell className='font-bold text-center'>{sectionTotal.practiceHours}ч</TableCell>
							<TableCell className='font-bold text-center'>{sectionTotal.individualHours}ч</TableCell>
							<TableCell className='font-bold text-center'>{sectionTotal.srspHours}ч</TableCell>
							<TableCell className='font-bold text-center'>{sectionTotal.srsHours}ч</TableCell>
							<TableCell className={cn('text-right font-bold', hasError && 'text-destructive')} colSpan={2}>
								Заявлено: {formatHours(discipline.totalHours)}
							</TableCell>
						</TableRow>
					</TableFooter>
				</Table>
			</div>
		</div>
	)
}

const TopicRowView = ({ topic, topicIndex }: { topic: Topic; topicIndex: number; rupModuleType: string }) => {
	const getTopicTypeName = (type: string) => {
		switch (type) {
			case TopicTypeEnum.SNZ:
				return 'СНЗ'
			case TopicTypeEnum.Practical:
				return 'Практическая'
			case TopicTypeEnum.Combined:
				return 'Комбинированная'
			default:
				return type
		}
	}

	return (
		<TableRow>
			<TableCell className='align-middle font-medium text-center w-24'>
				<span>{topicIndex + 1}</span>
			</TableCell>
			<TableCell className='align-middle'>
				<div className='min-w-[200px]'>{topic.name}</div>
			</TableCell>
			<TableCell className='align-middle text-center font-bold'>
				<p>{topic.totalHours}ч</p>
			</TableCell>
			<TableCell className='align-middle text-center font-medium'>{topic.theoryHours}ч</TableCell>
			<TableCell className='align-middle text-center font-medium'>{topic.practiceHours}ч</TableCell>
			<TableCell className='align-middle text-center font-medium'>
				<p>{topic.individualHours}ч</p>
			</TableCell>
			<TableCell className='align-middle text-center font-medium'>{topic.srspHours || 0}ч</TableCell>
			<TableCell className='align-middle text-center font-medium'>{topic.srsHours || 0}ч</TableCell>
			<TableCell className='align-middle text-end'>{getTopicTypeName(topic.type)}</TableCell>
		</TableRow>
	)
}
