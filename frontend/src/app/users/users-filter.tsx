import { useEffect, useState } from 'react'

import { Button, Input } from '@shadcn'
import { Filter, Search } from 'lucide-react'

interface UsersFilterProps {
	search: string
	onSearchSubmit: (value: string) => void
	onRefetch: () => void
}

export function UsersFilter({ search, onSearchSubmit, onRefetch }: UsersFilterProps) {
	const [inputValue, setInputValue] = useState(search)

	useEffect(() => {
		setInputValue(search)
	}, [search])

	const handleSearch = () => {
		onSearchSubmit(inputValue)
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			handleSearch()
			onRefetch()
		}
	}

	return (
		<div className='flex flex-col lg:flex-row items-center justify-between mb-6 gap-4'>
			<div className='flex flex-col lg:flex-row items-center gap-4 w-full lg:w-auto'>
				{/* search */}
				<div className='relative w-full lg:w-72'>
					<Button
						className='absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8'
						size='icon'
						variant='ghost'
						onClick={handleSearch}
					>
						<Search className='h-4 w-4 text-muted-foreground' />
					</Button>
					<Input
						className='pl-10'
						placeholder='Поиск по имени или email...'
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={handleKeyDown}
					/>
				</div>
			</div>

			<Button className='w-full lg:w-auto' size='default' variant='default' onClick={onRefetch}>
				Применить
				<Filter className='ml-2 h-4 w-4' />
			</Button>
		</div>
	)
}
