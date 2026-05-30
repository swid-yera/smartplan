'use client'

import { getUILocaleSection, normalizeRupType, normalizeStudyForm } from '@helpers'
import { toLocaleKey } from '../../rup-localization'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { type Locale, type LocaleText, RupTypeEnum, StudyFormEnum } from '@types'
import { Info } from 'lucide-react'
import type { FieldValues, Path } from 'react-hook-form'
import { useFormContext } from 'react-hook-form'
import localeDictionary from './locale.json'

// Define a base shape for the form data that this component needs.
// Any form passed to this component must have at least these fields.
type IProps = FieldValues & {
	name: LocaleText
	type: RupTypeEnum
	studyForm: StudyFormEnum
	prerequisites: LocaleText
	postrequisites: LocaleText
}

export function BasicEdit<T extends IProps>({ activeLocale }: { activeLocale: Locale }) {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const { control } = useFormContext<T>()
	const rupTypeTips = t.basic.rupTypeTips as Record<RupTypeEnum, string>
	const localeKey = toLocaleKey(activeLocale)

	const getRawLocaleTextValue = (value: unknown): LocaleText => {
		if (value && typeof value === 'object' && 'ru' in value && 'kz' in value) {
			const localized = value as Partial<LocaleText>

			return {
				ru: typeof localized.ru === 'string' ? localized.ru : '',
				kz: typeof localized.kz === 'string' ? localized.kz : '',
			}
		}

		if (typeof value === 'string') {
			return { ru: value, kz: value }
		}

		return { ru: '', kz: '' }
	}

	const updateRawLocaleText = (value: unknown, nextValue: string): LocaleText => {
		const localized = getRawLocaleTextValue(value)

		return {
			...localized,
			[localeKey]: nextValue,
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t.basicTitle}</CardTitle>
				<CardDescription>{t.basicDescription}</CardDescription>
			</CardHeader>

			<CardContent className='space-y-3 text-sm'>
				<FormField
					control={control}
					name={'name' as Path<T>}
					render={({ field }) => (
						<FormItem>
							<FormLabel className='flex items-center'>{t.basic.moduleNameLabel}</FormLabel>
							<FormControl>
								<Input
									placeholder={t.basic.moduleNamePlaceholder}
									value={getRawLocaleTextValue(field.value)[localeKey]}
									onChange={(event) =>
										field.onChange(updateRawLocaleText(field.value, event.target.value))
									}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className='grid lg:grid-cols-[minmax(1,2fr)_minmax(0.6,0.8fr)] gap-5'>
					<FormField
						control={control}
						name={'type' as Path<T>}
						render={({ field }) => (
							<FormItem>
								<FormLabel className='flex items-center'>
									{t.basic.moduleTypeLabel}
									<Tooltip>
										<TooltipTrigger className='ml-1' type='button'>
											<Info size='14' />
										</TooltipTrigger>
										<TooltipContent side='top'>
											{Object.entries(rupTypeTips).map((obj) => (
												<p key={obj[0]}>
													<span className='font-bold'>{normalizeRupType(obj[0] as RupTypeEnum, locale)}:</span>
													<br />
													{obj[1]}
												</p>
											))}
										</TooltipContent>
									</Tooltip>
								</FormLabel>
								<FormControl>
									<Select key={field.value} value={field.value} onValueChange={field.onChange}>
										<SelectTrigger className='w-full'>
											<SelectValue placeholder={t.basic.moduleTypePlaceholder} />
										</SelectTrigger>
										<SelectContent position='popper'>
											{Object.values(RupTypeEnum).map((val) => (
												<SelectItem key={val} value={val}>
													{normalizeRupType(val, locale)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name={'studyForm' as Path<T>}
						render={({ field }) => (
							<FormItem>
								<FormLabel className='flex items-center'>{t.basic.studyFormLabel}</FormLabel>
								<FormControl>
									<Select value={field.value ?? ''} onValueChange={field.onChange}>
										<SelectTrigger className='w-full'>
											<SelectValue placeholder={t.basic.studyFormPlaceholder} />
										</SelectTrigger>
										<SelectContent position='popper'>
											{Object.keys(StudyFormEnum).map((studyForm) => (
												<SelectItem key={studyForm} value={studyForm}>
													{normalizeStudyForm(studyForm as StudyFormEnum, locale)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* requisites */}
				<FormField
					control={control}
					name={'prerequisites' as Path<T>}
					render={({ field }) => (
						<FormItem>
							<FormLabel className='flex items-center'>{t.basic.prerequisitesLabel}</FormLabel>
							<FormControl>
								<Input
									placeholder={t.basic.prerequisitesPlaceholder}
									value={getRawLocaleTextValue(field.value)[localeKey]}
									onChange={(event) =>
										field.onChange(updateRawLocaleText(field.value, event.target.value))
									}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={control}
					name={'postrequisites' as Path<T>}
					render={({ field }) => (
						<FormItem>
							<FormLabel className='flex items-center'>{t.basic.postrequisitesLabel}</FormLabel>
							<FormControl>
								<Input
									placeholder={t.basic.postrequisitesPlaceholder}
									value={getRawLocaleTextValue(field.value)[localeKey]}
									onChange={(event) =>
										field.onChange(updateRawLocaleText(field.value, event.target.value))
									}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</CardContent>
		</Card>
	)
}
