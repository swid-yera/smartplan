import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface UsersPaginationProps {
	currentPage: number
	totalPages: number
	itemsPerPage: number
	onPageChange: (page: number) => void
	onItemsPerPageChange: (items: number) => void
}

export function UsersPagination({
	currentPage,
	totalPages,
	itemsPerPage,
	onPageChange,
	onItemsPerPageChange,
}: UsersPaginationProps) {
	return (
		<div className='flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 py-4'>
			<div className='flex items-center space-x-2 text-sm text-muted-foreground'>
				<p className='text-sm text-muted-foreground'>Строк на странице</p>
				<Select
					value={`${itemsPerPage}`}
					onValueChange={(value) => {
						onItemsPerPageChange(Number(value))
					}}
				>
					<SelectTrigger className='h-8 w-[70px]'>
						<SelectValue placeholder={itemsPerPage} />
					</SelectTrigger>
					<SelectContent side='top'>
						{[10, 20, 50].map((pageSize) => (
							<SelectItem key={pageSize} value={`${pageSize}`}>
								{pageSize}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className='flex items-center space-x-2'>
				<div className='text-sm text-muted-foreground mr-2'>
					Страница {currentPage} из {totalPages || 1}
				</div>
				<Button
					disabled={currentPage === 1}
					size='sm'
					variant='outline'
					onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
				>
					<ChevronLeft className='h-4 w-4' />
				</Button>
				<Button
					disabled={currentPage === totalPages || totalPages === 0}
					size='sm'
					variant='outline'
					onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
				>
					<ChevronRight className='h-4 w-4' />
				</Button>
			</div>
		</div>
	)
}
