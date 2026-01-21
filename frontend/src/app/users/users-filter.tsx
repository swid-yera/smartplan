import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui'
import { ArrowUpDown, Search } from 'lucide-react'

interface UsersFilterProps {
	search: string
	onSearchChange: (value: string) => void
	role: string
	onRoleChange: (value: string) => void
	onSortToggle: () => void
}

export function UsersFilter({ search, onSearchChange, role, onRoleChange, onSortToggle }: UsersFilterProps) {
	return (
		<div className='flex flex-col lg:flex-row items-center justify-between mb-6 gap-4'>
			<div className='flex flex-col lg:flex-row items-center gap-4 w-full lg:w-auto'>
				{/* search */}
				<div className='relative w-full lg:w-72'>
					<Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />

					<Input
						className='pl-8'
						placeholder='Поиск по имени или email...'
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
					/>
				</div>

				{/* role  */}
				<Select value={role} onValueChange={onRoleChange}>
					<SelectTrigger className='w-full lg:w-[180px]'>
						<SelectValue placeholder='Выберите роль' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all'>Все роли</SelectItem>
						<SelectItem value='TEACHER'>Преподаватель</SelectItem>
						<SelectItem value='ADMIN'>Администратор</SelectItem>
						<SelectItem value='METHODIST'>Методист</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<Button className='w-full lg:w-auto' size='sm' variant='outline' onClick={onSortToggle}>
				Сортировка
				<ArrowUpDown className='ml-2 h-4 w-4' />
			</Button>
		</div>
	)
}
