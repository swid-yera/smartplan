'use client'

import { type ReactNode, useEffect, useState } from 'react'

import type { NextPage } from 'next'
import { useRouter } from 'next/navigation'

import { PageTitle, withPermission } from '@components'
import {
	formatCourseFromYearAndGroupName,
	generateStudyYears,
	getGroupYear,
	getLocaleText,
	getUILocaleSection,
	interpolateUILocaleText,
	normalizeRupType,
	normalizeStudyForm,
} from '@helpers'
import { cn } from '@lib'
import { services } from '@services'
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Dropzone,
	DropzoneContent,
	DropzoneEmptyState,
	Label,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { useMutation, useQuery } from '@tanstack/react-query'
import { type IParseRupImportResponse, PermissionCodeEnum } from '@types'
import { isAxiosError } from 'axios'
import { AlertTriangle, Check, ChevronsUpDown, FileText, Loader2, RefreshCw, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

import localeDictionary from './locale.json'

const MAX_FILE_BYTES = 15 * 1024 * 1024
const DOCX_ACCEPT = {
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
}
const COURSE_OPTIONS = [1, 2, 3, 4] as const
const STUDY_YEAR_PATTERN = /^\d{4}-\d{4}$/

type CourseOption = (typeof COURSE_OPTIONS)[number]

const isCourseOption = (value: number): value is CourseOption => {
	return COURSE_OPTIONS.includes(value as CourseOption)
}

const formatFileSize = (bytes: number) => {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`

	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getErrorMessage = (error: unknown, fallback: string) => {
	if (isAxiosError(error)) {
		const data = error.response?.data as { error?: unknown; details?: unknown; detail?: unknown } | undefined
		const message = data?.details ?? data?.detail ?? data?.error

		if (typeof message === 'string' && message.trim()) return message
		if (message) return JSON.stringify(message)
		if (error.message) return error.message
	}

	if (error instanceof Error && error.message) return error.message

	return fallback
}

const joinValues = (values: string[] | undefined, emptyValue: string) => {
	const filtered = (values ?? []).map((value) => value.trim()).filter(Boolean)

	return filtered.length ? filtered.join(', ') : emptyValue
}

const getCurrentAcademicYear = () => {
	const now = new Date()
	const currentYear = now.getFullYear()
	const academicYearStart = now.getMonth() >= 8 ? currentYear : currentYear - 1

	return `${academicYearStart}-${academicYearStart + 1}`
}

const Metric = ({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) => (
	<div className='rounded-lg border bg-card p-3'>
		<p className='text-xs text-muted-foreground'>{label}</p>
		<div className='mt-1 text-sm font-medium'>{value}</div>
		{hint ? <div className='mt-1 text-xs text-muted-foreground'>{hint}</div> : null}
	</div>
)

const Page: NextPage = () => {
	const router = useRouter()
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	const [files, setFiles] = useState<File[]>([])
	const [parseResult, setParseResult] = useState<IParseRupImportResponse | null>(null)
	const [selectedGroupId, setSelectedGroupId] = useState('')
	const [studyYear, setStudyYear] = useState('')
	const [course, setCourse] = useState('')
	const [groupOpen, setGroupOpen] = useState(false)

	const parseMutation = useMutation(services.rup.parseImportOptions())
	const confirmMutation = useMutation(services.rup.confirmImportOptions())
	const { data: groupsData = [], isLoading: isGroupsLoading } = useQuery({
		...services.group.getAllOptions(),
		enabled: true,
	})

	const file = files[0]
	const payload = parseResult?.payload
	const warnings = parseResult?.warnings?.length ? parseResult.warnings : (payload?.warnings ?? [])
	const selectedGroup = groupsData.find((group) => group.keycloakId === selectedGroupId)
	const groupsByCourse = (() => {
		const sections = new Map<number, typeof groupsData>()
		const uncategorizedGroups: typeof groupsData = []

		for (const group of groupsData) {
			const courseValue = formatCourseFromYearAndGroupName(group.name, getCurrentAcademicYear())

			if (typeof courseValue !== 'number') {
				uncategorizedGroups.push(group)
				continue
			}

			const courseGroups = sections.get(courseValue) || []

			courseGroups.push(group)
			sections.set(courseValue, courseGroups)
		}

		return {
			orderedSections: Array.from(sections.entries())
				.sort(([leftCourse], [rightCourse]) => leftCourse - rightCourse)
				.map(([courseValue, sectionGroups]) => ({
					course: courseValue,
					groups: sectionGroups.sort((left, right) => left.name.localeCompare(right.name, locale)),
				})),
			uncategorizedGroups: uncategorizedGroups.sort((left, right) => left.name.localeCompare(right.name, locale)),
		}
	})()
	const groupYear = selectedGroup ? getGroupYear(selectedGroup.name) : undefined
	const availableStudyYears = Array.from(
		new Set(typeof groupYear === 'number' ? generateStudyYears(groupYear) : []),
	).sort()
	const parsedName = payload ? getLocaleText(payload.name, locale) : ''
	const topicCount = payload?.disciplines.reduce((count, discipline) => count + discipline.topics.length, 0) ?? 0
	const canConfirm =
		!!parseResult && !!selectedGroupId && STUDY_YEAR_PATTERN.test(studyYear.trim()) && isCourseOption(Number(course))

	useEffect(() => {
		if (!parseResult) return

		const courseSuggestion = Number(parseResult.payload.courseSuggestion)

		setSelectedGroupId('')
		setStudyYear(parseResult.payload.studyYearSuggestion || '')
		setCourse(isCourseOption(courseSuggestion) ? String(courseSuggestion) : '')
	}, [parseResult])

	useEffect(() => {
		if (!selectedGroup) {
			setStudyYear('')

			return
		}

		if (!availableStudyYears.length) {
			setStudyYear('')

			return
		}

		if (studyYear && availableStudyYears.includes(studyYear)) {
			return
		}

		if (payload?.studyYearSuggestion && availableStudyYears.includes(payload.studyYearSuggestion)) {
			setStudyYear(payload.studyYearSuggestion)

			return
		}

		setStudyYear(availableStudyYears[0])
	}, [availableStudyYears, payload?.studyYearSuggestion, selectedGroup, studyYear])

	const resetParsedState = () => {
		setParseResult(null)
		setSelectedGroupId('')
		setStudyYear('')
		setCourse('')
	}

	const selectGroup = (groupId: string) => {
		setSelectedGroupId(groupId)
		setGroupOpen(false)
	}

	const handleDrop = (acceptedFiles: File[]) => {
		const nextFile = acceptedFiles[0]

		setFiles(nextFile ? [nextFile] : [])
		resetParsedState()
	}

	const clearFile = () => {
		setFiles([])
		resetParsedState()
	}

	const handleParse = () => {
		if (!file) {
			toast.error(t.selectFileFirst)

			return
		}

		const toastId = 'rup-import-parse'

		toast.loading(t.parseLoading, { id: toastId })
		parseMutation.mutate(
			{ file },
			{
				onSuccess: (response) => {
					setParseResult(response)
					toast.success(t.parseSuccess, { id: toastId })
				},
				onError: (error) => {
					toast.error(`${t.parseError}: ${getErrorMessage(error, t.unknownError)}`, { id: toastId })
				},
			},
		)
	}

	const handleConfirm = () => {
		if (!parseResult) {
			toast.error(t.missingParsedData)

			return
		}
		if (!selectedGroupId) {
			toast.error(t.missingGroup)

			return
		}
		if (!STUDY_YEAR_PATTERN.test(studyYear.trim())) {
			toast.error(t.invalidStudyYear)

			return
		}

		const numericCourse = Number(course)

		if (!isCourseOption(numericCourse)) {
			toast.error(t.invalidCourse)

			return
		}

		const toastId = 'rup-import-confirm'

		toast.loading(t.confirmLoading, { id: toastId })
		confirmMutation.mutate(
			{
				importDraftId: parseResult.importDraftId,
				groupIds: [selectedGroupId],
				studyYear: studyYear.trim(),
				course: numericCourse,
			},
			{
				onSuccess: (createdRup) => {
					toast.success(`${t.confirmSuccess}: ${getLocaleText(createdRup.name, locale)}`, { id: toastId })
					router.push(`/rups/${createdRup.id}`)
				},
				onError: (error) => {
					toast.error(`${t.confirmError}: ${getErrorMessage(error, t.unknownError)}`, { id: toastId })
				},
			},
		)
	}

	return (
		<div className='space-y-6 p-6'>
			<PageTitle
				actions={
					<div className='flex flex-wrap items-center justify-end gap-2'>
						<Badge variant='secondary'>{t.draftBadge}</Badge>
						<Badge variant='outline'>{t.noAiBadge}</Badge>
					</div>
				}
				backHref='back'
				description={t.description}
			>
				{t.title}
			</PageTitle>

			<div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)]'>
				<div className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle>{t.uploadTitle}</CardTitle>
							<CardDescription>{t.uploadDescription}</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							<Dropzone
								accept={DOCX_ACCEPT}
								className='min-h-44 justify-center'
								disabled={parseMutation.isPending || confirmMutation.isPending}
								maxFiles={1}
								maxSize={MAX_FILE_BYTES}
								multiple={false}
								src={files.length ? files : undefined}
								onDrop={handleDrop}
								onError={(error) => toast.error(error.message || t.fileDropError)}
							>
								<DropzoneEmptyState>
									<div className='flex flex-col items-center justify-center text-center'>
										<div className='flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
											<Upload size={18} />
										</div>
										<p className='my-2 text-wrap text-sm font-medium'>{t.dropTitle}</p>
										<p className='text-wrap text-xs text-muted-foreground'>{t.dropHint}</p>
									</div>
								</DropzoneEmptyState>
								<DropzoneContent>
									<div className='w-full text-left'>
										<div className='flex items-start gap-3 rounded-lg border bg-background p-3'>
											<FileText className='mt-0.5 h-5 w-5 shrink-0 text-primary' />
											<div className='min-w-0'>
												<p className='text-xs text-muted-foreground'>{t.selectedFile}</p>
												<p className='truncate text-sm font-medium'>{file?.name}</p>
												<p className='text-xs text-muted-foreground'>
													{file ? formatFileSize(file.size) : ''}
												</p>
											</div>
										</div>
										<p className='mt-3 text-center text-xs text-muted-foreground'>{t.replaceFile}</p>
									</div>
								</DropzoneContent>
							</Dropzone>

							{file ? (
								<Button
									className='w-full sm:w-auto'
									disabled={parseMutation.isPending || confirmMutation.isPending}
									type='button'
									variant='ghost'
									onClick={clearFile}
								>
									<X className='mr-2 h-4 w-4' />
									{t.clearFile}
								</Button>
							) : null}

							<Button
								className='w-full sm:w-auto'
								disabled={!file || parseMutation.isPending || confirmMutation.isPending}
								type='button'
								onClick={handleParse}
							>
								{parseMutation.isPending ? (
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								) : parseResult ? (
									<RefreshCw className='mr-2 h-4 w-4' />
								) : (
									<FileText className='mr-2 h-4 w-4' />
								)}
								{parseResult ? t.parseAgainButton : t.parseButton}
							</Button>
						</CardContent>
					</Card>

					{payload ? (
						<Card>
							<CardHeader>
								<CardTitle>{t.summaryTitle}</CardTitle>
								<CardDescription>{t.summaryDescription}</CardDescription>
							</CardHeader>
							<CardContent className='space-y-5'>
								<div>
									<p className='text-xs text-muted-foreground'>{t.nameLabel}</p>
									<p className='mt-1 text-base font-semibold'>{parsedName || t.emptyValue}</p>
								</div>

								<div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
									<Metric label={t.typeLabel} value={normalizeRupType(payload.type, locale) || payload.type} />
									<Metric
										label={t.studyFormLabel}
										value={normalizeStudyForm(payload.studyForm, locale) || payload.studyForm}
									/>
									<Metric label={t.totalHoursLabel} value={payload.totalHours || t.emptyValue} />
									<Metric label={t.disciplinesLabel} value={payload.disciplines.length} />
									<Metric label={t.topicsLabel} value={topicCount} />
									<Metric
										label={t.languageLabel}
										value={payload.sourceLanguage?.toUpperCase() || t.emptyValue}
									/>
								</div>

								<Separator />

								<div className='space-y-3'>
									<h3 className='text-sm font-semibold'>{t.rawHintsTitle}</h3>
									<div className='grid gap-3 md:grid-cols-2'>
										<Metric label={t.groupHintLabel} value={joinValues(payload.groupsRaw, t.emptyValue)} />
										<Metric
											label={t.studyYearHintLabel}
											value={payload.studyYearSuggestion || t.emptyValue}
										/>
										<Metric label={t.courseHintLabel} value={payload.courseSuggestion || t.emptyValue} />
										<Metric label={t.specialtyHintLabel} value={payload.specialtyRaw || t.emptyValue} />
										<Metric
											label={t.qualificationHintLabel}
											value={payload.qualificationRaw || t.emptyValue}
										/>
										<Metric
											label={t.developersHintLabel}
											value={joinValues(payload.developersRaw, t.emptyValue)}
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					) : null}

					{warnings.length > 0 ? (
						<Alert>
							<AlertTriangle className='h-4 w-4' />
							<AlertTitle>{t.warningsTitle}</AlertTitle>
							<AlertDescription>
								<ul className='list-disc space-y-1 pl-4'>
									{warnings.map((warning) => (
										<li key={warning}>{warning}</li>
									))}
								</ul>
							</AlertDescription>
						</Alert>
					) : null}
				</div>

				<Card className='h-fit xl:sticky xl:top-6'>
					<CardHeader>
						<CardTitle>{t.reviewTitle}</CardTitle>
						<CardDescription>{payload ? t.reviewDescription : t.waitingForParseDescription}</CardDescription>
					</CardHeader>
					<CardContent className='space-y-5'>
						{payload ? (
							<>
								<div className='space-y-2'>
									<Label>{t.groupLabel}</Label>
									<Popover open={groupOpen} onOpenChange={setGroupOpen}>
										<PopoverTrigger asChild>
											<Button
												className={cn('w-full justify-between', !selectedGroup && 'text-muted-foreground')}
												disabled={isGroupsLoading || confirmMutation.isPending}
												role='combobox'
												type='button'
												variant='outline'
											>
												{selectedGroup
													? selectedGroup.name
													: isGroupsLoading
														? t.groupsLoading
														: t.groupPlaceholder}
												<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
											</Button>
										</PopoverTrigger>
										<PopoverContent align='center' className='w-[--radix-popover-trigger-width] p-0'>
											<Command>
												<CommandInput placeholder={t.groupSearch} />
												<CommandList>
													<CommandEmpty>{t.groupNotFound}</CommandEmpty>
													{groupsByCourse.orderedSections.map(({ course: courseValue, groups }) => {
														return (
															<CommandGroup
																key={courseValue}
																heading={interpolateUILocaleText(t.courseFull, { course: courseValue })}
															>
																{groups.map((group) => (
																	<CommandItem
																		key={group.keycloakId}
																		value={`${group.name} ${getLocaleText(group.specialty, locale)} ${getLocaleText(
																			group.qualification,
																			locale,
																		)}`}
																		onSelect={() => selectGroup(group.keycloakId)}
																	>
																		<Check
																			className={cn(
																				'mr-2 h-4 w-4',
																				selectedGroupId === group.keycloakId
																					? 'opacity-100'
																					: 'opacity-0',
																			)}
																		/>
																		<div className='flex w-full items-center justify-between gap-2'>
																			<span>{group.name}</span>
																			<span className='shrink-0 text-xs text-muted-foreground'>
																				{interpolateUILocaleText(t.courseShort, {
																					course: courseValue,
																				})}
																			</span>
																		</div>
																	</CommandItem>
																))}
															</CommandGroup>
														)
													})}
													{groupsByCourse.uncategorizedGroups.length > 0 ? (
														<CommandGroup heading={t.noCourse}>
															{groupsByCourse.uncategorizedGroups.map((group) => (
																<CommandItem
																	key={group.keycloakId}
																	value={group.name}
																	onSelect={() => selectGroup(group.keycloakId)}
																>
																	<Check
																		className={cn(
																			'mr-2 h-4 w-4',
																			selectedGroupId === group.keycloakId
																				? 'opacity-100'
																				: 'opacity-0',
																		)}
																	/>
																	{group.name}
																</CommandItem>
															))}
														</CommandGroup>
													) : null}
												</CommandList>
											</Command>
										</PopoverContent>
									</Popover>
									{payload.groupsRaw?.length ? (
										<p className='text-xs text-muted-foreground'>
											{interpolateUILocaleText(t.suggestion, {
												value: joinValues(payload.groupsRaw, t.emptyValue),
											})}
										</p>
									) : null}
								</div>

								<div className='space-y-2'>
									<Label>{t.studyYearLabel}</Label>
									<Select
										disabled={!selectedGroup || !availableStudyYears.length || confirmMutation.isPending}
										value={studyYear}
										onValueChange={setStudyYear}
									>
										<SelectTrigger className='w-full'>
											<SelectValue placeholder={t.studyYearPlaceholder} />
										</SelectTrigger>
										<SelectContent>
											{availableStudyYears.map((year) => (
												<SelectItem key={year} value={year}>
													{year}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{payload.studyYearSuggestion ? (
										<div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
											<span>
												{interpolateUILocaleText(t.suggestion, { value: payload.studyYearSuggestion })}
											</span>
											{availableStudyYears.includes(payload.studyYearSuggestion) ? (
												<Button
													size='sm'
													type='button'
													variant='ghost'
													onClick={() => setStudyYear(payload.studyYearSuggestion || '')}
												>
													{t.useSuggestion}
												</Button>
											) : null}
										</div>
									) : null}
								</div>

								<div className='space-y-2'>
									<Label>{t.courseLabel}</Label>
									<Select disabled={confirmMutation.isPending} value={course} onValueChange={setCourse}>
										<SelectTrigger className='w-full'>
											<SelectValue placeholder={t.coursePlaceholder} />
										</SelectTrigger>
										<SelectContent>
											{COURSE_OPTIONS.map((courseOption) => (
												<SelectItem key={courseOption} value={String(courseOption)}>
													{courseOption} {t.courseSuffix}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{payload.courseSuggestion ? (
										<div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
											<span>
												{interpolateUILocaleText(t.suggestion, { value: payload.courseSuggestion })}
											</span>
											{isCourseOption(Number(payload.courseSuggestion)) ? (
												<Button
													size='sm'
													type='button'
													variant='ghost'
													onClick={() => setCourse(String(payload.courseSuggestion))}
												>
													{t.useSuggestion}
												</Button>
											) : null}
										</div>
									) : null}
								</div>

								<Button
									className='w-full'
									disabled={!canConfirm || confirmMutation.isPending || parseMutation.isPending}
									size='lg'
									type='button'
									onClick={handleConfirm}
								>
									{confirmMutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
									{t.confirmButton}
								</Button>
							</>
						) : (
							<div className='rounded-lg border border-dashed p-6 text-center'>
								<FileText className='mx-auto h-8 w-8 text-muted-foreground' />
								<p className='mt-3 text-sm font-medium'>{t.waitingForParseTitle}</p>
								<p className='mt-1 text-xs text-muted-foreground'>{t.waitingForParseDescription}</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

export default withPermission(Page, [
	PermissionCodeEnum.RUP_FULL,
	PermissionCodeEnum.RUP_VIEW,
	PermissionCodeEnum.RUP_MANAGE,
])
