'use client'

import { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { RegenerateDescriptionDialog, TopicTypeBadge } from '@components'
import {
	createLocaleText,
	formatAsDash,
	formatHours,
	getLocaleText,
	getUILocaleSection,
	toBackendLocale,
} from '@helpers'
import { cn } from '@lib'
import { services } from '@services'
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
} from '@shadcn'
import { useMutation } from '@tanstack/react-query'
import { type Locale, type LocalizedText, type RupTypeEnum, StatusEnum, TopicTypeEnum } from '@types'
import { BookOpenText, ChevronDown, Info } from 'lucide-react'
import { toast } from 'sonner'

import localeDictionary from './locale.json'

type TopicsLocaleText = typeof localeDictionary.ru.topics

type Topic = {
	id: string
	name: LocalizedText
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
	name: LocalizedText
	totalHours: number
	topics: Topic[]
}

interface IProps {
	rupId: string
	type: RupTypeEnum
	disciplines: Discipline[]
	rupStatus: StatusEnum
	activeLocale: Locale
}

export function TopicsView({ rupId, type: rupModuleType, disciplines, rupStatus, activeLocale }: IProps) {
	const t = getUILocaleSection(localeDictionary, activeLocale)
	const tv = t.topics
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
				<CardTitle className='text-xl'>{t.topicsTitle}</CardTitle>
				<CardDescription>{t.topicsDescription}</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4'>
				{disciplines.length > 0 ? (
					disciplines.map((discipline, index) => (
						<DisciplineBlockView
							key={discipline.id || `${index}`}
							activeLocale={activeLocale}
							discipline={discipline}
							rupId={rupId}
							rupModuleType={rupModuleType}
							rupStatus={rupStatus}
							text={tv}
						/>
					))
				) : (
					<div className='text-center text-xl text-muted-foreground py-4'>{tv.empty}</div>
				)}

				<div className='flex justify-end items-center pt-4 pr-6 space-x-4'>
					<div className='grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-right'>
						<p className='font-medium'>{tv.declaredHours}:</p>
						<p className='font-bold text-2xl'>{disciplines.reduce((sum, d) => sum + d.totalHours, 0)}</p>

						<p className='font-medium'>{tv.currentHours}:</p>
						<div
							className={cn(
								'font-bold text-right text-2xl',
								total.totalHours !== disciplines.reduce((sum, d) => sum + d.totalHours, 0) &&
									'text-destructive',
							)}
						>
							<p>{total.totalHours}</p>
							<p className='text-xs font-normal text-muted-foreground'>
								({tv.theory}: {total.theoryHours} / {tv.practice}: {total.practiceHours} / {tv.individual}:{' '}
								{total.individualHours} / {tv.srsp}: {total.srspHours} / {tv.srs}: {total.srsHours})
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

function DisciplineBlockView({
	activeLocale,
	discipline,
	rupId,
	rupModuleType,
	rupStatus,
	text,
}: {
	activeLocale: Locale
	discipline: Discipline
	rupId: string
	rupModuleType: string
	rupStatus: StatusEnum
	text: TopicsLocaleText
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
				<div className='font-semibold pr-4'>{getLocaleText(discipline.name, activeLocale)}</div>
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
									{text.tableTopic}
								</TableHead>
								<TableHead
									className='p-4 font-semibold align-bottom wrap-break-words whitespace-normal text-center border-x'
									rowSpan={2}
								>
									{text.tableTotal}
								</TableHead>
								<TableHead className='text-center align-center font-semibold' colSpan={3}>
									{text.including}
								</TableHead>
								<TableHead className='p-4 border-x align-bottom font-semibold text-center' rowSpan={2}>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger className='flex items-center justify-center w-full gap-1'>
												{text.srsp} <Info className='w-3 h-3' />
											</TooltipTrigger>
											<TooltipContent>
												<p>{text.srspTooltip}</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</TableHead>
								<TableHead className='p-4 border-r align-bottom font-semibold text-center' rowSpan={2}>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger className='flex items-center justify-center w-full gap-1'>
												{text.srs} <Info className='w-3 h-3' />
											</TooltipTrigger>
											<TooltipContent>
												<p>{text.srsTooltip}</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</TableHead>
								<TableHead className='p-4 font-semibold text-end align-bottom pb-4' rowSpan={2}>
									{text.type}
								</TableHead>
							</TableRow>
							<TableRow>
								<TableHead className='p-4 font-semibold border-r text-center' colSpan={1}>
									{text.theory}
								</TableHead>
								<TableHead className='p-4 font-semibold border-r text-center'>{text.practice}</TableHead>
								<TableHead className='p-4 font-semibold text-center'>{text.individual}</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{discipline.topics.length > 0 ? (
								discipline.topics.map((topic, topicIndex) => (
									<TopicRowView
										key={topicIndex}
										activeLocale={activeLocale}
										disciplineId={discipline.id}
										rupId={rupId}
										rupModuleType={rupModuleType}
										rupStatus={rupStatus}
										text={text}
										topic={topic}
										topicIndex={topicIndex}
									/>
								))
							) : (
								<TableRow>
									<TableCell className='py-12 text-center text-muted-foreground text-lg' colSpan={9}>
										{text.empty}
									</TableCell>
								</TableRow>
							)}
						</TableBody>

						<TableFooter>
							<TableRow>
								<TableCell className={cn('text-right font-bold', hasError && 'text-destructive')} colSpan={2}>
									{text.sectionTotal}:
								</TableCell>
								<TableCell className={cn('font-bold text-center border-x', hasError && 'text-destructive')}>
									{formatHours(sectionTotal.totalHours, activeLocale)}
								</TableCell>
								<TableCell className='font-bold text-center border-r'>{sectionTotal.theoryHours}</TableCell>
								<TableCell className='font-bold text-center border-r'>{sectionTotal.practiceHours}</TableCell>
								<TableCell className='font-bold text-center border-r'>{sectionTotal.individualHours}</TableCell>
								<TableCell className='font-bold text-center border-r'>{sectionTotal.srspHours}</TableCell>
								<TableCell className='font-bold text-center border-r'>{sectionTotal.srsHours}</TableCell>
								<TableCell className={cn('text-right font-bold', hasError && 'text-destructive')}>
									{text.declared}: {formatHours(discipline.totalHours, activeLocale)}
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
	activeLocale,
	topic,
	topicIndex,
	disciplineId,
	rupId,
	rupStatus,
	text,
}: {
	activeLocale: Locale
	topic: Topic
	topicIndex: number
	disciplineId?: string
	rupId: string
	rupModuleType: string
	rupStatus: StatusEnum
	text: TopicsLocaleText
}) => {
	const router = useRouter()

	const isApproved = rupStatus === StatusEnum.APPROVED
	const isLessonGenerated = Boolean(topic.lessonId)
	const lessonUrl = `/lessons/${topic.lessonId || topic.id}`
	const generateLessonMutation = useMutation(services.lesson.generateLessonOptions())
	const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
	const [regenerateDescription, setRegenerateDescription] = useState('')

	const handleGenerateClick = () => {
		setRegenerateDescription('')
		setIsGenerateDialogOpen(true)
	}

	const onSubmit = async () => {
		if (!disciplineId) {
			toast.error(text.disciplineIdMissing)

			return
		}

		const payload = {
			rupId,
			disciplineId,
			topicId: topic.id,
			sourceLanguage: toBackendLocale(activeLocale),
			message: regenerateDescription.trim(),
			updatedTopic: {
				name: createLocaleText(getLocaleText(topic.name, 'ru'), getLocaleText(topic.name, 'kk')),
				type: topic.type,
				total_hours: topic.theoryHours + topic.practiceHours + topic.individualHours,
				theory_hours: topic.theoryHours,
				practice_hours: topic.practiceHours,
				individual_hours: topic.individualHours,
				srsp_hours: topic.srspHours ?? 0,
				srs_hours: topic.srsHours ?? 0,
			},
		}

		const toastId = `generate-lesson-${topic.id}`

		toast.loading(text.lessonLoading, { id: toastId })

		try {
			const response = await generateLessonMutation.mutateAsync(payload)

			if (response.status && response.lessonId) {
				toast.success(text.lessonSuccess, { id: toastId })
				router.push(`/lessons/${response.lessonId}`)
			} else {
				toast.error(text.lessonGenerateError, { id: toastId })
			}
		} catch (err) {
			toast.error(text.lessonGenerateCatch, {
				description: err instanceof Error ? err.message : 'Unknown error',
				id: toastId,
			})
		} finally {
			setIsGenerateDialogOpen(false)
		}
	}

	return (
		<>
			<TableRow>
				<TableCell className='align-middle font-semibold text-center p-4 pr-2'>
					<span>{topicIndex + 1}</span>
				</TableCell>
				<TableCell className='align-middle py-4 px-2 border-r whitespace-break-spaces min-w-[200px]'>
					<div className='flex justify-between items-center gap-2'>
						<span>{getLocaleText(topic.name, activeLocale)}</span>
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
										<p>{isLessonGenerated ? text.openLesson : text.generateLesson}</p>
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
					<TopicTypeBadge locale={activeLocale} type={topic.type} />
				</TableCell>
			</TableRow>

			<RegenerateDescriptionDialog
				cancelLabel={text.cancel}
				confirmLabel={text.generate}
				description={regenerateDescription}
				descriptionId={`topic-regenerate-description-${topic.id}`}
				descriptionLabel={text.descriptionLabel}
				descriptionPlaceholder={text.descriptionPlaceholder}
				dialogDescription={text.generateDialogDescription}
				isConfirmDisabled={regenerateDescription.trim().length === 0}
				isOpen={isGenerateDialogOpen}
				isPending={generateLessonMutation.isPending}
				title={text.generateDialogTitle}
				onConfirm={onSubmit}
				onDescriptionChange={setRegenerateDescription}
				onOpenChange={setIsGenerateDialogOpen}
			/>
		</>
	)
}
