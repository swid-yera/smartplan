'use client'

import type { FC } from 'react'

import { formatAsDash, getLocaleText, getUILocaleSection } from '@helpers'
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
} from '@shadcn'
import { useLocaleStore } from '@store'
import type { IDiscipline, Locale, LocalizedText } from '@types'
import localeDictionary from './locale.json'

interface IProps {
	disciplines: IDiscipline[]
	rupName: LocalizedText
	activeLocale: Locale
}

export const DisciplineView: FC<IProps> = ({ disciplines = [], rupName, activeLocale }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const totalModuleHours = disciplines.reduce((acc, d) => acc + d.totalHours, 0)

	const semesterTotals = Array(8).fill(0)

	disciplines.forEach((discipline) => {
		discipline.semesters.forEach((semester, i) => {
			semesterTotals[i] += semester.totalHours || 0
		})
	})

	return (
		<Card>
			<CardHeader className='flex-row items-start justify-between gap-4'>
				<div>
					<CardTitle>{t.disciplineTitle}</CardTitle>
					<CardDescription>{t.disciplineDescription}</CardDescription>
				</div>
			</CardHeader>
			<CardContent>
				<div className='overflow-x-auto'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='align-bottom w-full pb-2' rowSpan={3}>
									{t.discipline.tableTitle}
								</TableHead>
								<TableHead
									className='align-bottom p-2 text-center wrap-break-words whitespace-normal'
									rowSpan={3}
								>
									{t.discipline.totalHours}
								</TableHead>
								<TableHead className='text-center' colSpan={8}>
									{t.discipline.semesters}
								</TableHead>
							</TableRow>
							<TableRow>
								{Array.from({ length: 4 }, (_, i) => (
									<TableHead key={i} className='text-center border-r last:border-r-0' colSpan={2}>
										{i + 1} {t.discipline.courseSuffix}
									</TableHead>
								))}
							</TableRow>
							<TableRow>
								{Array.from({ length: 8 }, (_, i) => (
									<TableHead key={i} className='text-xs text-center border-r last:border-r-0 py-2 px-6'>
										{i + 1}
										<br />
										{t.discipline.semesterSuffix}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{disciplines?.length > 0 ? (
								<>
									<RupRow activeLocale={activeLocale} rupName={rupName} />
									{disciplines.map((discipline, disciplineIndex) => (
										<DisciplineRowView
											key={disciplineIndex}
											activeLocale={activeLocale}
											discipline={discipline}
										/>
									))}
								</>
							) : (
								<TableRow>
									<TableCell className='h-24 text-center text-muted-foreground' colSpan={10}>
										{t.discipline.empty}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
						{disciplines?.length > 0 && (
							<TableFooter>
								<TableRow>
									<TableCell className='text-left font-bold'>{t.discipline.total}:</TableCell>
									<TableCell className='text-center font-bold border-x'>{totalModuleHours}</TableCell>
									{semesterTotals.map((totalHours, i) => (
										<TableCell key={i} className='text-center font-bold border-r last:border-r-0'>
											<p>{formatAsDash(totalHours)}</p>
										</TableCell>
									))}
								</TableRow>
								<TableRow>
									<TableCell className='text-left font-bold whitespace-break-spaces'>
										{t.discipline.totalForModule}:
									</TableCell>
									<TableCell className='text-center font-bold border-x'>{totalModuleHours}</TableCell>
									{semesterTotals.map((totalHours, i) => (
										<TableCell key={i} className='text-center font-bold border-r last:border-r-0'>
											<p>{formatAsDash(totalHours)}</p>
										</TableCell>
									))}
								</TableRow>
							</TableFooter>
						)}
					</Table>
				</div>
			</CardContent>
		</Card>
	)
}

const RupRow: FC<{ rupName: LocalizedText; activeLocale: Locale }> = ({ rupName, activeLocale }) => {
	return (
		<TableRow className='*:border-border [&>:not(:last-child)]:border-r'>
			<TableCell className='whitespace-break-spaces text-sm text-muted-foreground py-2'>
				{formatAsDash(getLocaleText(rupName, activeLocale))}
			</TableCell>
			<TableCell className='align-middle text-center w-24 font-medium' />
			{[0, 1, 2, 3, 4, 5, 6, 7].map((semester) => (
				<TableCell key={semester} className='align-middle text-center text-sm' />
			))}
		</TableRow>
	)
}

const DisciplineRowView: FC<{ discipline: IDiscipline; activeLocale: Locale }> = ({ discipline, activeLocale }) => {
	return (
		<TableRow className='*:border-border [&>:not(:last-child)]:border-r'>
			<TableCell className='text-sm text-muted-foreground py-2 whitespace-break-spaces'>
				{formatAsDash(getLocaleText(discipline.name, activeLocale))}
			</TableCell>
			<TableCell className='align-middle text-center w-24 font-medium'>
				<p>{discipline.totalHours}</p>
			</TableCell>
			{discipline.semesters.map((semester, semesterIndex) => (
				<TableCell key={semesterIndex} className='align-middle text-center text-sm'>
					{formatAsDash(semester.totalHours)}
				</TableCell>
			))}
		</TableRow>
	)
}
