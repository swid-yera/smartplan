'use client'

import type { Dispatch, SetStateAction } from 'react'

import { getLessonTypeLabels, getUILocaleSection } from '@helpers'
import { cn } from '@lib'
import {
	Button,
	Calendar,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { LessonTypeEnum } from '@types'
import { format } from 'date-fns'
import { CalendarDays, ChevronDown, FileText, Grid2X2, SquareMenu } from 'lucide-react'

import type { ILessonFormState } from './lesson-edit.types'
import { getEventTimeError, normalizeTimeInputOnBlur, sanitizeTimeInput } from './lesson-edit.utils'
import localeDictionary from './locale.json'

type IProps = {
	activeLocale: 'ru' | 'kk'
	eventTimeError: string | null
	formData: ILessonFormState
	isDatePickerOpen: boolean
	onDatePickerOpenChange: Dispatch<SetStateAction<boolean>>
	onEventTimeErrorChange: Dispatch<SetStateAction<string | null>>
	onFormDataChange: Dispatch<SetStateAction<ILessonFormState>>
}

export function LessonMainInfoCard({
	activeLocale,
	eventTimeError,
	formData,
	isDatePickerOpen,
	onDatePickerOpenChange,
	onEventTimeErrorChange,
	onFormDataChange,
}: IProps) {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const lessonTypeLabels = getLessonTypeLabels(locale)

	return (
		<Card>
			<CardHeader>
				<CardTitle className='inline-flex items-center gap-2'>
					<FileText className='h-4 w-4 text-primary' />
					{t.mainInfoTitle}
				</CardTitle>
				<CardDescription>{t.mainInfoDescription}</CardDescription>
			</CardHeader>
			<CardContent className='grid gap-4 sm:grid-cols-2'>
				<div className='grid gap-2 sm:col-span-2'>
					<Label className='inline-flex items-center gap-2' htmlFor='topic-name'>
						<SquareMenu className='h-4 w-4 text-primary' />
						{t.lessonTopic}
					</Label>
					<Input
						id='topic-name'
						value={formData.topicName[activeLocale]}
						onChange={(e) =>
							onFormDataChange((prev) => ({
								...prev,
								topicName: { ...prev.topicName, [activeLocale]: e.target.value },
							}))
						}
					/>
				</div>
				<div className='grid gap-2'>
					<Label className='inline-flex items-center gap-2'>
						<Grid2X2 className='h-4 w-4 text-primary' />
						{t.lessonType}
					</Label>
					<Select
						value={formData.type}
						onValueChange={(value) => onFormDataChange((prev) => ({ ...prev, type: value as LessonTypeEnum }))}
					>
						<SelectTrigger className='w-full'>
							<SelectValue placeholder={t.chooseType} />
						</SelectTrigger>
						<SelectContent>
							{Object.values(LessonTypeEnum).map((type) => (
								<SelectItem key={type} value={type}>
									{lessonTypeLabels[type]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className='grid gap-2'>
					<Label className='inline-flex items-center gap-2' htmlFor='event-date'>
						<CalendarDays className='h-4 w-4 text-primary' />
						{t.lessonDate}
					</Label>
					<div className='grid grid-cols-2 gap-2'>
						<Popover open={isDatePickerOpen} onOpenChange={onDatePickerOpenChange}>
							<PopoverTrigger asChild>
								<Button className='w-full justify-between font-normal' id='event-date' variant='outline'>
									{formData.eventDate ? format(formData.eventDate, 'dd.MM.yyyy') : t.chooseDate}
									<ChevronDown />
								</Button>
							</PopoverTrigger>
							<PopoverContent align='start' className='w-auto overflow-hidden p-0'>
								<Calendar
									captionLayout='dropdown'
									defaultMonth={formData.eventDate}
									mode='single'
									selected={formData.eventDate}
									onSelect={(eventDate) => {
										onFormDataChange((prev) => ({ ...prev, eventDate }))
										onDatePickerOpenChange(false)
									}}
								/>
							</PopoverContent>
						</Popover>
						<Input
							aria-describedby='event-time-error'
							aria-invalid={Boolean(eventTimeError)}
							className={cn('w-full', eventTimeError && 'border-destructive focus-visible:ring-destructive/30')}
							id='event-time'
							inputMode='numeric'
							maxLength={5}
							placeholder={t.chooseTime}
							type='text'
							value={formData.eventTime}
							onBlur={() => {
								const normalizedValue = normalizeTimeInputOnBlur(formData.eventTime)

								onFormDataChange((prev) => ({ ...prev, eventTime: normalizedValue }))
								onEventTimeErrorChange(getEventTimeError(normalizedValue))
							}}
							onChange={(e) => {
								onFormDataChange((prev) => ({ ...prev, eventTime: sanitizeTimeInput(e.target.value) }))

								if (eventTimeError) {
									onEventTimeErrorChange(null)
								}
							}}
						/>
					</div>
					{eventTimeError && (
						<p className='text-sm text-destructive' id='event-time-error'>
							{eventTimeError}
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
