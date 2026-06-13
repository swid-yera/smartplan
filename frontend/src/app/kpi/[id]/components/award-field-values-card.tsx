'use client'

import { useMemo } from 'react'

import { MediaPreviewerCard } from '@components'
import { formatCourseFromYearAndGroupName, getLocaleText, getUILocaleSection } from '@helpers'
import { Card, CardContent, CardHeader, CardTitle, Separator } from '@shadcn'
import { useLocaleStore } from '@store'
import type { IAward } from '@types'
import { format, isValid, parseISO } from 'date-fns'

import localeDictionary from './locale.json'

interface IAwardFieldValuesCardProps {
	award: IAward
}

const capitalizeFirstLetter = (value: string) => {
	const trimmedValue = value.trim()

	if (!trimmedValue) return value

	return `${trimmedValue.charAt(0).toUpperCase()}${trimmedValue.slice(1)}`
}

const getCurrentAcademicYear = () => {
	const now = new Date()
	const currentYear = now.getFullYear()
	const academicYearStart = now.getMonth() >= 8 ? currentYear : currentYear - 1

	return `${academicYearStart}-${academicYearStart + 1}`
}

const normalizeStringArray = (value: unknown) => {
	if (Array.isArray(value)) {
		return value
			.filter((item): item is string => typeof item === 'string')
			.map((item) => item.trim())
			.filter(Boolean)
	}

	if (typeof value === 'string') {
		const trimmed = value.trim()

		return trimmed ? [trimmed] : []
	}

	return []
}

const getGroupCourse = (groupName: string) => {
	const course = formatCourseFromYearAndGroupName(groupName, getCurrentAcademicYear())

	return typeof course === 'number' ? course : null
}

export const AwardFieldValuesCard = ({ award }: IAwardFieldValuesCardProps) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).fieldValues
	const categoryFields = award.category?.fieldsExpanded || []
	const categoryFieldLabelByKey = new Map(
		categoryFields.map((field) => [
			field.key,
			capitalizeFirstLetter(getLocaleText(field.label, locale) || field.key),
		]),
	)
	const categoryFieldByKey = new Map(categoryFields.map((field) => [field.key, field]))
	const fileKeyRegex = /(file|document|attachment|image|photo|scan)/i
	const urlKeyRegex = /(url|link|website)/i
	const fileValueRegex = /\.(jpg|jpeg|png|gif|webp|bmp|svg|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar)(\?.*)?$/i
	const urlValueRegex = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(?:[/?#].*)?$/i

	const normalizeValue = (value: unknown): string => {
		if (value === null || value === undefined) return ''
		if (typeof value === 'string') return value.trim()
		if (typeof value === 'number' || typeof value === 'boolean') return String(value)
		if (typeof value === 'object') {
			const localizedText = getLocaleText(value as Parameters<typeof getLocaleText>[0], locale)

			if (localizedText) return localizedText.trim()

			return ''
		}

		return ''
	}

	const formatDateValue = (value: string) => {
		const trimmedValue = value.trim()

		if (!trimmedValue) {
			return null
		}

		const parsedDate = parseISO(trimmedValue)
		const date = isValid(parsedDate) ? parsedDate : new Date(trimmedValue)

		if (!isValid(date)) {
			return null
		}

		const localeCode = locale === 'kk' ? 'kk-KZ' : 'ru-RU'

		return {
			dotted: format(date, 'dd.MM.yyyy'),
			text: new Intl.DateTimeFormat(localeCode, {
				day: 'numeric',
				month: 'long',
				year: 'numeric',
			}).format(date),
		}
	}

	const awardFieldValues = Object.entries(award.fieldValues || {}).filter(([fieldKey]) => {
		const fieldType = categoryFieldByKey.get(fieldKey)?.type

		return fieldType !== 'multi_fields' && fieldType !== 'group'
	})

	const groupFieldEntries = useMemo(() => {
		return Object.entries(award.fieldValues || {}).filter(([fieldKey]) => {
			return categoryFieldByKey.get(fieldKey)?.type === 'group'
		})
	}, [award.fieldValues, categoryFieldByKey])

	const isFileValue = (value: string) => fileValueRegex.test(value.trim())
	const isUrlValue = (value: string) => urlValueRegex.test(value.trim())
	const getFieldLabel = (fieldKey: string) => categoryFieldLabelByKey.get(fieldKey) || fieldKey
	const getFieldType = (fieldKey: string) => categoryFieldByKey.get(fieldKey)?.type

	const sections = awardFieldValues.reduce(
		(acc, [fieldKey, rawValue]) => {
			const values = (Array.isArray(rawValue) ? rawValue : [rawValue])
				.map((value) => normalizeValue(value))
				.filter((value) => value.length > 0)
			const lowerFieldKey = fieldKey.toLowerCase()

			if (fileKeyRegex.test(lowerFieldKey) || (values.length > 0 && values.every((value) => isFileValue(value)))) {
				acc.file.push({ fieldKey, fieldLabel: getFieldLabel(fieldKey), values })

				return acc
			}

			if (urlKeyRegex.test(lowerFieldKey) || (values.length > 0 && values.every((value) => isUrlValue(value)))) {
				acc.url.push({ fieldKey, fieldLabel: getFieldLabel(fieldKey), values })

				return acc
			}

			acc.info.push({ fieldKey, fieldLabel: getFieldLabel(fieldKey), values })

			return acc
		},
		{
			file: [] as Array<{ fieldKey: string; fieldLabel: string; values: string[] }>,
			info: [] as Array<{ fieldKey: string; fieldLabel: string; values: string[] }>,
			url: [] as Array<{ fieldKey: string; fieldLabel: string; values: string[] }>,
		},
	)

	const groupSections = useMemo(() => {
		return groupFieldEntries.map(([fieldKey, rawValue]) => {
			const values = normalizeStringArray(rawValue)
			const groupsWithCourses = values.map((groupName) => ({
				groupName,
				course: getGroupCourse(groupName),
			}))
			const courseBuckets = new Map<number, string[]>()
			const uncategorized: string[] = []

			for (const item of groupsWithCourses) {
				if (item.course === null) {
					uncategorized.push(item.groupName)
					continue
				}

				const current = courseBuckets.get(item.course) || []

				current.push(item.groupName)
				courseBuckets.set(item.course, current)
			}

			const orderedCourses = Array.from(courseBuckets.entries())
				.sort(([left], [right]) => left - right)
				.map(([course, groupNames]) => ({
					course,
					groupNames,
				}))

			const distinctCourseCount = orderedCourses.length
			const canGroupByCourse = values.length > 1 && distinctCourseCount > 1

			return {
				fieldKey,
				fieldLabel: getFieldLabel(fieldKey),
				values,
				orderedCourses,
				uncategorized,
				canGroupByCourse,
			}
		})
	}, [groupFieldEntries, categoryFieldByKey])

	const multiFieldSections = categoryFields
		.filter((field) => field.type === 'multi_fields')
		.map((field) => {
			const rawValue = award.fieldValues?.[field.key]
			const subFields = Array.isArray(field.options)
				? field.options.filter(
						(option): option is { key: string; label: unknown; type: string } =>
							typeof option === 'object' && option !== null && 'key' in option && 'label' in option,
					)
				: []

			const rows = Array.isArray(rawValue)
				? rawValue
						.map((row) => {
							if (!row || typeof row !== 'object' || Array.isArray(row)) return null

							const normalizedRow: Record<string, string> = {}

							for (const subField of subFields) {
								const rowValue = row[subField.key]

								if (typeof rowValue === 'number' && Number.isFinite(rowValue)) {
									normalizedRow[subField.key] = String(rowValue)
									continue
								}

								if (typeof rowValue === 'object' && rowValue !== null) {
									const localizedText = getLocaleText(rowValue as Parameters<typeof getLocaleText>[0], locale)

									normalizedRow[subField.key] = localizedText || ''
									continue
								}

								normalizedRow[subField.key] = typeof rowValue === 'string' ? rowValue.trim() : ''
							}

							return normalizedRow
						})
						.filter((row): row is Record<string, string> => !!row)
				: []

			return {
				fieldKey: field.key,
				fieldLabel: capitalizeFirstLetter(getLocaleText(field.label, locale) || field.key),
				rows,
				subFields,
			}
		})

	const renderTextValues = (values: string[]) => {
		if (values.length === 0) {
			return <p className='text-sm text-muted-foreground'>{t.emptyValue}</p>
		}

		return values.map((value, idx) => (
			<p key={`${value}-${idx}`} className='text-sm whitespace-pre-wrap break-all'>
				{value}
			</p>
		))
	}

	const renderDateValue = (value: string) => {
		const formatted = formatDateValue(value)

		if (!formatted) {
			return <p className='text-sm whitespace-pre-wrap break-all'>{value}</p>
		}

		return (
			<div className='space-y-0.5'>
				<p className='text-sm whitespace-pre-wrap break-all'>{formatted.text}</p>
				<p className='text-xs text-muted-foreground'>{formatted.dotted}</p>
			</div>
		)
	}

	const renderUrlValues = (values: string[]) => {
		if (values.length === 0) {
			return <p className='text-sm text-muted-foreground'>{t.emptyValue}</p>
		}

		return values.map((value, idx) => {
			const href = /^https?:\/\//i.test(value) ? value : `https://${value}`

			return (
				<a
					key={`${value}-${idx}`}
					className='block text-sm text-primary hover:underline break-all'
					href={href}
					rel='noopener noreferrer'
					target='_blank'
				>
					{value}
				</a>
			)
		})
	}

	const renderFileValues = (fieldKey: string, values: string[]) => {
		if (values.length === 0) {
			return <p className='text-sm text-muted-foreground'>{t.emptyValue}</p>
		}

		return values.map((value, idx) => (
			<MediaPreviewerCard
				key={`${fieldKey}-${value}-${idx}`}
				fileIndex={idx + 1}
				fileName={capitalizeFirstLetter(fieldKey)}
				fileUrl={value}
				labels={{
					download: t.download,
					hidePreview: t.hidePreview,
					preview: t.preview,
					previewUnavailable: t.previewUnavailable,
				}}
			/>
		))
	}

	const renderGroupList = (values: string[]) => {
		if (values.length === 0) {
			return <p className='text-sm text-muted-foreground'>{t.emptyValue}</p>
		}

		return (
			<div className='grid gap-x-4 gap-y-1 sm:grid-cols-2 xl:grid-cols-3'>
				{values.map((value, idx) => (
					<p key={`${value}-${idx}`} className='text-sm whitespace-pre-wrap break-all'>
						{value}
					</p>
				))}
			</div>
		)
	}

	const renderGroupedByCourse = (groupSection: (typeof groupSections)[number]) => {
		if (!groupSection.canGroupByCourse) {
			return renderGroupList(groupSection.values)
		}

		return (
			<div className='space-y-4'>
				<div className='grid gap-4 md:grid-cols-2'>
					{groupSection.orderedCourses.map(({ course, groupNames }) => (
						<div key={`${groupSection.fieldKey}-course-${course}`} className='space-y-2 rounded-md border p-3'>
							<p className='text-sm font-medium text-muted-foreground'>
								{t.courseFull.replace('{course}', String(course))}
							</p>
							<div className='grid gap-x-4 gap-y-1 sm:grid-cols-2 xl:grid-cols-3'>
								{groupNames.map((groupName, idx) => (
									<p key={`${groupName}-${idx}`} className='text-sm whitespace-pre-wrap break-all'>
										{groupName}
									</p>
								))}
							</div>
						</div>
					))}
				</div>

				{groupSection.uncategorized.length > 0 ? (
					<div className='space-y-2 rounded-md border border-dashed p-3'>
						<p className='text-sm font-medium text-muted-foreground'>{t.noCourse}</p>
						{renderGroupList(groupSection.uncategorized)}
					</div>
				) : null}
			</div>
		)
	}

	const hasAdditionalSections = sections.url.length > 0 || sections.file.length > 0 || multiFieldSections.length > 0
	const hasGroupSections = groupSections.length > 0

	return (
		<Card className='md:col-span-3'>
			<CardHeader>
				<CardTitle>{t.title}</CardTitle>
			</CardHeader>
			<CardContent className='space-y-6'>
				{awardFieldValues.length === 0 && multiFieldSections.length === 0 && groupSections.length === 0 ? (
					<div className='rounded-md bg-muted/50 p-4 text-sm text-muted-foreground'>{t.noAdditionalFields}</div>
				) : (
					<>
						<div className='space-y-3'>
							<h3 className='font-semibold'>{t.categoryFields}</h3>
							{sections.info.length > 0 || hasGroupSections ? (
								<div className='grid gap-4 md:grid-cols-2'>
									{sections.info.map(({ fieldKey, fieldLabel, values }) => (
										<div key={fieldKey} className='space-y-2 rounded-md border p-3'>
											<p className='text-sm font-medium text-muted-foreground'>{fieldLabel}</p>
											<div className='space-y-2'>
												{getFieldType(fieldKey) === 'date'
													? values.map((value, idx) => (
															<div key={`${value}-${idx}`}>{renderDateValue(value)}</div>
														))
													: renderTextValues(values)}
											</div>
										</div>
									))}

									{groupSections.map((groupSection) => (
										<div
											key={groupSection.fieldKey}
											className='space-y-2 rounded-md border p-3 md:col-span-2'
										>
											<p className='text-sm font-medium text-muted-foreground'>{groupSection.fieldLabel}</p>
											{renderGroupedByCourse(groupSection)}
										</div>
									))}
								</div>
							) : (
								<p className='text-sm text-muted-foreground'>{t.emptyValue}</p>
							)}
						</div>

						{multiFieldSections.length > 0 ? (
							<div className='space-y-3'>
								<h3 className='font-semibold'>{t.multiFields}</h3>
								<div className='space-y-4'>
									{multiFieldSections.map(({ fieldKey, fieldLabel, rows, subFields }) => (
										<div key={fieldKey} className='space-y-3 rounded-md border p-3'>
											<p className='text-sm font-medium text-muted-foreground'>{fieldLabel}</p>

											{rows.length > 0 ? (
												<div className='space-y-3'>
													{rows.map((row, rowIndex) => (
														<div
															key={`${fieldKey}-${rowIndex}`}
															className='space-y-3 rounded-md bg-muted/30 p-3'
														>
															<p className='text-xs font-medium text-muted-foreground'>
																{t.multiFieldsRowTitle.replace('{index}', String(rowIndex + 1))}
															</p>
															<div className='grid gap-3 md:grid-cols-2'>
																{subFields.map((subField) => (
																	<div
																		key={`${fieldKey}-${rowIndex}-${subField.key}`}
																		className='space-y-1'
																	>
																		<p className='text-xs font-medium text-muted-foreground'>
																			{getLocaleText(
																				subField.label as Parameters<typeof getLocaleText>[0],
																				locale,
																			) || subField.key}
																		</p>
																		{subField.type === 'date' ? (
																			row[subField.key] ? (
																				renderDateValue(row[subField.key])
																			) : (
																				<p className='text-sm text-muted-foreground'>
																					{t.emptyValue}
																				</p>
																			)
																		) : (
																			<p className='text-sm break-all'>
																				{row[subField.key] || t.emptyValue}
																			</p>
																		)}
																	</div>
																))}
															</div>
														</div>
													))}
												</div>
											) : (
												<p className='text-sm text-muted-foreground'>{t.multiFieldsEmpty}</p>
											)}
										</div>
									))}
								</div>
							</div>
						) : null}

						{hasAdditionalSections ? <Separator /> : null}

						{sections.url.length > 0 ? (
							<div className='space-y-3'>
								<h3 className='font-semibold'>{t.urlFields}</h3>
								<div className='space-y-4'>
									{sections.url.map(({ fieldKey, fieldLabel, values }) => (
										<div key={fieldKey} className='space-y-2 rounded-md border p-3'>
											<p className='text-sm font-medium text-muted-foreground'>{fieldLabel}</p>
											<div className='space-y-2'>{renderUrlValues(values)}</div>
										</div>
									))}
								</div>
							</div>
						) : null}

						{sections.url.length > 0 && sections.file.length > 0 ? <Separator /> : null}

						{sections.file.length > 0 ? (
							<div className='space-y-3'>
								<h3 className='font-semibold'>{t.fileFields}</h3>
								<div className='space-y-4'>
									{sections.file.map(({ fieldKey, fieldLabel, values }) => (
										<div key={fieldKey} className='space-y-2 rounded-md border p-3'>
											<p className='text-sm font-medium text-muted-foreground'>{fieldLabel}</p>
											<div className='space-y-3'>{renderFileValues(fieldLabel, values)}</div>
										</div>
									))}
								</div>
							</div>
						) : null}
					</>
				)}
			</CardContent>
		</Card>
	)
}
