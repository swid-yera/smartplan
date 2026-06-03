'use client'

import type { FormEvent } from 'react'

import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@shadcn'
import { Search } from 'lucide-react'

import type { LessonListFiltersCardProps } from './lesson-list.types'

export function LessonListFiltersCard({
	allDisciplinesLabel,
	allFilterValue = 'ALL',
	allGroupsLabel,
	allTypesLabel,
	applyLabel,
	className,
	description,
	disciplineOptions,
	disciplinePlaceholder,
	groupOptions,
	groupPlaceholder,
	lessonTypeLabel,
	lessonTypeOptions,
	onDisciplineChange,
	onGroupChange,
	onReset,
	onSearchSubmit,
	onSortChange,
	onTypeChange,
	resetLabel,
	searchDefaultValue,
	searchPlaceholder,
	selectedDiscipline,
	selectedGroup,
	selectedSort,
	selectedType,
	sortPlaceholder,
	sortNewestLabel,
	sortOldestLabel,
	title,
}: LessonListFiltersCardProps) {
	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const formData = new FormData(event.currentTarget)
		const search = String(formData.get('q') || '').trim()

		onSearchSubmit(search)
	}

	return (
		<Card className={className}>
			<CardHeader className='pb-3'>
				<CardTitle className='text-base'>{title}</CardTitle>
				{description ? <CardDescription>{description}</CardDescription> : null}
			</CardHeader>
			<CardContent>
				<form className='grid gap-3 md:grid-cols-2 xl:grid-cols-5' onSubmit={handleSubmit}>
					<div className='relative md:col-span-2'>
						<Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
						<Input
							key={searchDefaultValue}
							className='pl-9'
							defaultValue={searchDefaultValue}
							name='q'
							placeholder={searchPlaceholder}
						/>
					</div>

					<Select value={selectedType} onValueChange={onTypeChange}>
						<SelectTrigger className='w-full'>
							<SelectValue placeholder={lessonTypeLabel} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={allFilterValue}>{allTypesLabel}</SelectItem>
							{lessonTypeOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select value={selectedDiscipline} onValueChange={onDisciplineChange}>
						<SelectTrigger className='w-full'>
							<SelectValue placeholder={disciplinePlaceholder} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={allFilterValue}>{allDisciplinesLabel}</SelectItem>
							{disciplineOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select value={selectedGroup} onValueChange={onGroupChange}>
						<SelectTrigger className='w-full'>
							<SelectValue placeholder={groupPlaceholder} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={allFilterValue}>{allGroupsLabel}</SelectItem>
							{groupOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select value={selectedSort} onValueChange={(value) => onSortChange(value as 'asc' | 'desc')}>
						<SelectTrigger className='w-full'>
							<SelectValue placeholder={sortPlaceholder} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='desc'>{sortNewestLabel}</SelectItem>
							<SelectItem value='asc'>{sortOldestLabel}</SelectItem>
						</SelectContent>
					</Select>

					<div className='flex flex-wrap items-center justify-end gap-2 md:col-span-2 xl:col-span-5'>
						<Button type='submit' variant='secondary'>
							<Search data-icon='inline-start' />
							{applyLabel}
						</Button>
						<Button type='button' variant='outline' onClick={onReset}>
							{resetLabel}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	)
}
