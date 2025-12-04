import type { IExportFilters, IExportJob } from '@types'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@ui'

interface ExportFiltersProps {
	filters: IExportFilters
	onFiltersChange: (filters: IExportFilters) => void
}

export const ExportFilters = ({ filters, onFiltersChange }: ExportFiltersProps) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Фильтры</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
					<div>
						<Label htmlFor='programFilter'>Программа</Label>
						<Input
							id='programFilter'
							placeholder='Название программы'
							value={filters.programName || ''}
							onChange={(e) => onFiltersChange({ ...filters, programName: e.target.value })}
						/>
					</div>
					<div>
						<Label htmlFor='rupFilter'>РУП</Label>
						<Input
							id='rupFilter'
							placeholder='Название РУП'
							value={filters.rupName || ''}
							onChange={(e) => onFiltersChange({ ...filters, rupName: e.target.value })}
						/>
					</div>
					<div>
						<Label htmlFor='yearFilter'>Учебный год</Label>
						<Input
							id='yearFilter'
							placeholder='2025-2026'
							value={filters.academicYear || ''}
							onChange={(e) => onFiltersChange({ ...filters, academicYear: e.target.value })}
						/>
					</div>
					<div>
						<Label htmlFor='typeFilter'>Формат</Label>
						<Select
							value={filters.exportType || 'all'}
							onValueChange={(value) =>
								onFiltersChange({
									...filters,
									exportType: value === 'all' ? undefined : (value as 'pdf' | 'excel'),
								})
							}
						>
							<SelectTrigger>
								<SelectValue placeholder='Все форматы' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>Все форматы</SelectItem>
								<SelectItem value='pdf'>PDF</SelectItem>
								<SelectItem value='excel'>Excel</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label htmlFor='statusFilter'>Статус</Label>
						<Select
							value={filters.status || 'all'}
							onValueChange={(value) =>
								onFiltersChange({
									...filters,
									status: value === 'all' ? undefined : (value as IExportJob['status']),
								})
							}
						>
							<SelectTrigger>
								<SelectValue placeholder='Все статусы' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>Все статусы</SelectItem>
								<SelectItem value='pending'>Ожидает</SelectItem>
								<SelectItem value='processing'>Обрабатывается</SelectItem>
								<SelectItem value='completed'>Завершено</SelectItem>
								<SelectItem value='failed'>Ошибка</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
