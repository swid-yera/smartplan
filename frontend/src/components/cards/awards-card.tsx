'use client'

import type { FC, ReactNode } from 'react'
import { useState } from 'react'

import { getLocaleText, getUILocaleSection, interpolateUILocaleText } from '@helpers'
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@shadcn'
import { useLocaleStore } from '@store'
import { type IAward } from '@types'
import { ChevronLeft, ChevronRight, UserIcon } from 'lucide-react'

import { StatusBadge } from '../badges/status-badge'
import { AwardSheet } from '../sheets/award-sheet'
import { Loader } from '../ui/loader'
import { EmptyCard } from './empty-card'
import localeDictionary from './locale.json'

interface IProps {
	awards: IAward[]
	currentPage: number
	totalPages: number
	onPageChange: (page: number) => void
	title: ReactNode
	description?: ReactNode
	isLoading: boolean
	showCreateOnEmpty?: boolean
}

export const AwardsCard: FC<IProps> = ({
	awards,
	currentPage,
	totalPages,
	onPageChange,
	title,
	description,
	isLoading,
	showCreateOnEmpty = false,
}) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).awardsCard
	const dateLocale = locale === 'kk' ? 'kk-KZ' : 'ru-RU'
	const [selectedAward, setSelectedAward] = useState<IAward | null>(null)
	const isExist = awards.length > 0 && !isLoading

	if (showCreateOnEmpty && !isExist && !isLoading) return <EmptyCard type='AWARD' />

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					{description && <CardDescription>{description}</CardDescription>}
				</CardHeader>
				<CardContent>
					<div className='relative overflow-x-auto min-w-0'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className='font-bold'>{t.createdAt}</TableHead>
									<TableHead className='font-bold'>{t.teacher}</TableHead>
									<TableHead className='font-bold'>{t.criteria}</TableHead>
									<TableHead className='font-bold'>{t.points}</TableHead>
									<TableHead className='text-right font-bold'>{t.status}</TableHead>
									{/* Убрали колонку "Действия", так как кликаем по строке */}
								</TableRow>
							</TableHeader>

							<TableBody>
								{isExist ? (
									awards.map((item) => <AwardRow key={item.id} award={item} onSelect={setSelectedAward} />)
								) : (
									<TableRow>
										<TableCell className='h-44 text-center' colSpan={6}>
											{isLoading ? (
												<Loader
													className='flex flex-col justify-center items-center'
													fullScreen={false}
													type='data'
												/>
											) : (
												t.empty
											)}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>

				{totalPages > 1 && (
					<CardFooter className='flex items-center justify-end space-x-2'>
						<Button
							disabled={currentPage <= 1}
							size='sm'
							variant='outline'
							onClick={() => onPageChange(currentPage - 1)}
						>
							<ChevronLeft className='h-4 w-4 mr-2' />
							{t.back}
						</Button>
						<div className='text-sm font-medium'>
							{interpolateUILocaleText(t.page, { current: currentPage, total: totalPages })}
						</div>
						<Button
							disabled={currentPage >= totalPages}
							size='sm'
							variant='outline'
							onClick={() => onPageChange(currentPage + 1)}
						>
							{t.next}
							<ChevronRight className='h-4 w-4 ml-2' />
						</Button>
					</CardFooter>
				)}
			</Card>

			<AwardSheet award={selectedAward} onSelect={(award) => setSelectedAward(award)} />
		</>
	)
}

interface IAwardRow {
	award: IAward
	onSelect: (award: IAward) => void
}

const AwardRow: FC<IAwardRow> = ({ award, onSelect }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).awardsCard
	const dateLocale = locale === 'kk' ? 'kk-KZ' : 'ru-RU'
	const teacherName = `${award?.teacher?.firstName} ${award?.teacher.lastName}`.trim() || t.unknownTeacher
	const createdAt = new Date(award.createdAt).toLocaleDateString(dateLocale)
	const updatedAt = new Date(award.updatedAt).toLocaleString(dateLocale)

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<TableRow className='cursor-pointer hover:bg-muted/50 transition-colors' onClick={() => onSelect(award)}>
					<TableCell className='font-medium whitespace-nowrap w-[84px] min-w-[84px]'>{createdAt}</TableCell>
					<TableCell className='font-medium whitespace-break-spaces min-w-[100px]'>
						<div className='flex items-center gap-2'>
							<UserIcon className='h-4 w-4 text-muted-foreground' />
							<span>{teacherName}</span>
						</div>
					</TableCell>
					<TableCell className='font-medium whitespace-break-spaces min-w-[300px] py-4'>
						{`${getLocaleText(award.variant.name, locale)}, ${getLocaleText(award.criteria.name, locale)}`}
					</TableCell>
					<TableCell className='py-6'>{award.totalPoints || 0}</TableCell>
					<TableCell className='text-right'>
						<StatusBadge status={award.status} />
					</TableCell>
				</TableRow>
			</TooltipTrigger>
			<TooltipContent side='top' sideOffset={8}>
				<div className='max-w-sm space-y-1'>
					<p className='text-sm'>
						{t.updatedAt}: <span className='font-medium'>{updatedAt}</span>
					</p>
					{award.reason && (
						<p className='text-sm'>
							{t.rejectReason}: <span className='font-medium'>{award.reason}</span>
						</p>
					)}
				</div>
			</TooltipContent>
		</Tooltip>
	)
}
