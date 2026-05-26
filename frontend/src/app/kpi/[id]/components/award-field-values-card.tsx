'use client'

import { MediaPreviwer } from '@components'
import { getLocaleText, getUILocaleSection } from '@helpers'
import { Card, CardContent, CardHeader, CardTitle, Separator } from '@shadcn'
import { useLocaleStore } from '@store'
import type { IAward } from '@types'

import localeDictionary from './locale.json'

interface IAwardFieldValuesCardProps {
	award: IAward
}

export const AwardFieldValuesCard = ({ award }: IAwardFieldValuesCardProps) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).fieldValues
	const awardFieldValues = Object.entries(award.fieldValues || {})
	const categoryFieldLabelByKey = new Map(
		(award.category?.fieldsExpanded || []).map((field) => [
			field.key,
			getLocaleText(field.label, locale) || field.key,
		]),
	)
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

	const isFileValue = (value: string) => fileValueRegex.test(value.trim())
	const isUrlValue = (value: string) => urlValueRegex.test(value.trim())
	const getFieldLabel = (fieldKey: string) => categoryFieldLabelByKey.get(fieldKey) || fieldKey

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
			<MediaPreviwer
				key={`${fieldKey}-${value}-${idx}`}
				fileIndex={idx + 1}
				fileName={fieldKey}
				fileUrl={value}
				labels={{
					download: t.download,
					hidePreview: t.hidePreview,
					preview: t.preview,
				}}
			/>
		))
	}

	const hasAdditionalSections = sections.url.length > 0 || sections.file.length > 0

	return (
		<Card className='md:col-span-3'>
			<CardHeader>
				<CardTitle>{t.title}</CardTitle>
			</CardHeader>
			<CardContent className='space-y-6'>
				{awardFieldValues.length === 0 ? (
					<div className='rounded-md bg-muted/50 p-4 text-sm text-muted-foreground'>{t.noAdditionalFields}</div>
				) : (
					<>
						<div className='space-y-3'>
							<h3 className='font-semibold'>{t.categoryFields}</h3>
							{sections.info.length > 0 ? (
								<div className='grid gap-4 md:grid-cols-2'>
									{sections.info.map(({ fieldKey, fieldLabel, values }) => (
										<div key={fieldKey} className='space-y-2 rounded-md border p-3'>
											<p className='text-sm font-medium text-muted-foreground'>{fieldLabel}</p>
											<div className='space-y-2'>{renderTextValues(values)}</div>
										</div>
									))}
								</div>
							) : (
								<p className='text-sm text-muted-foreground'>{t.emptyValue}</p>
							)}
						</div>

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
