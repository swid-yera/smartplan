'use client'

import type { FC } from 'react'

import { interpolateUILocaleText } from '@helpers'
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shadcn'
import { useLocaleStore } from '@store'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import uiLocale from './locale.json'

interface IProps {
	page: number
	totalPages: number
	pageSize: number
	pageSizeOptions?: number[]
	onPageChange: (page: number) => void
	onPageSizeChange?: (size: number) => void
}

export const Pagination: FC<IProps> = ({
	page,
	totalPages,
	pageSize,
	pageSizeOptions = [10, 20, 50],
	onPageChange,
	onPageSizeChange,
}) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = uiLocale[locale] ?? uiLocale.ru

	return (
		<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4'>
			{/* Page size */}
			{onPageSizeChange && (
				<div className='flex items-center gap-2 text-sm text-muted-foreground'>
					<span>{t.pagination.rowsPerPage}</span>

					<Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
						<SelectTrigger className='h-8 w-20'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent side='top'>
							{pageSizeOptions.map((size) => (
								<SelectItem key={size} value={String(size)}>
									{size}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			)}

			{/* Navigation */}
			<div className='flex items-center gap-2'>
				<span className='mr-2 text-sm text-muted-foreground'>
					{interpolateUILocaleText(t.pagination.pageOf, { page, totalPages: totalPages || 1 })}
				</span>

				<Button disabled={page <= 1} size='sm' variant='outline' onClick={() => onPageChange(page - 1)}>
					<ChevronLeft className='h-4 w-4' />
				</Button>

				<Button
					disabled={page >= totalPages || totalPages === 0}
					size='sm'
					variant='outline'
					onClick={() => onPageChange(page + 1)}
				>
					<ChevronRight className='h-4 w-4' />
				</Button>
			</div>
		</div>
	)
}
