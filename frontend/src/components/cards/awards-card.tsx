'use client'

import type { FC, ReactNode } from 'react'
import { useState } from 'react'

import Link from 'next/link'

import { getCategoryIconOptionByName, getLocaleText, getUILocaleSection, interpolateUILocaleText } from '@helpers'
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
import { ChevronLeft, ChevronRight, Folder, UserIcon } from 'lucide-react'

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
	showPointsColumn?: boolean
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
	showPointsColumn = true,
}) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).awardsCard
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
									<TableHead>{t.createdAt}</TableHead>
									<TableHead>{t.teacher}</TableHead>
									<TableHead>{t.criteria}</TableHead>
									{showPointsColumn && <TableHead>{t.points}</TableHead>}
									<TableHead className='text-right'>{t.status}</TableHead>
									{/* Убрали колонку "Действия", так как кликаем по строке */}
								</TableRow>
							</TableHeader>

							<TableBody>
								{isExist ? (
									awards.map((item) => (
										<AwardRow
											key={item.id}
											award={item}
											showPointsColumn={showPointsColumn}
											onSelect={setSelectedAward}
										/>
									))
								) : (
									<TableRow>
										<TableCell className='h-44 text-center' colSpan={showPointsColumn ? 5 : 4}>
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
	showPointsColumn: boolean
}

const AwardRow: FC<IAwardRow> = ({ award, onSelect, showPointsColumn }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale).awardsCard
	const dateLocale = locale === 'kk' ? 'kk-KZ' : 'ru-RU'
	const teacherName = `${award?.teacher?.firstName} ${award?.teacher.lastName}`.trim() || t.unknownTeacher
	const categoryIconOption = getCategoryIconOptionByName(award.category?.icon)
	const CategoryIcon = categoryIconOption?.Icon || Folder
	const criteriaSummary = `${getLocaleText(award.type.name, locale)} / ${getLocaleText(award.criteria.name, locale)}`
	const createdAt = new Date(award.createdAt).toLocaleDateString(dateLocale)
	const updatedAt = new Date(award.updatedAt).toLocaleString(dateLocale)

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<TableRow
					className='cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70'
					role='button'
					tabIndex={0}
					onClick={() => onSelect(award)}
					onKeyDown={(event) => {
						if (event.key !== 'Enter' && event.key !== ' ') return
						event.preventDefault()
						onSelect(award)
					}}
				>
					<TableCell className='font-medium whitespace-nowrap w-[84px] min-w-[84px]'>{createdAt}</TableCell>
					<TableCell className='font-medium whitespace-break-spaces min-w-[100px]'>
						<div className='flex items-center gap-2'>
							<UserIcon className='h-4 w-4 text-muted-foreground' />
							<span>{teacherName}</span>
						</div>
					</TableCell>
					<TableCell className='font-medium whitespace-break-spaces min-w-[300px] py-4'>
						<Link
							className='flex items-center gap-2 rounded-sm hover:text-primary hover:underline'
							href={`/kpi/${award.id}`}
							onClick={(event) => event.stopPropagation()}
						>
							<CategoryIcon className='h-4 w-4 shrink-0 text-primary' />
							<span>{criteriaSummary}</span>
						</Link>
					</TableCell>
					{showPointsColumn && <TableCell className='py-6'>{award.totalPoints || 0}</TableCell>}
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
