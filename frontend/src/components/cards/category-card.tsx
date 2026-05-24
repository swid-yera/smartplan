'use client'

import Link from 'next/link'

import { getCategoryIconOptionByName, getLocaleText } from '@helpers'
import { Card, CardContent, Tooltip, TooltipContent, TooltipTrigger } from '@shadcn'
import { useLocaleStore } from '@store'
import type { ICategoryListItemResponse } from '@types'
import { Folder } from 'lucide-react'

interface IProps {
	category: ICategoryListItemResponse
}

export const CategoryCard = ({ category }: IProps) => {
	const locale = useLocaleStore((state) => state.locale)
	const matchedIcon = getCategoryIconOptionByName(category.icon)
	const IconComponent = matchedIcon?.Icon || Folder
	const name = getLocaleText(category.name, locale)
	const description = getLocaleText(category.description, locale) || 'Описание отсутствует'

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Link href={`/kpi/categories/${category.id}`}>
					<Card className='group h-full transition-all duration-200 hover:-translate-y-1 hover:bg-muted/30 hover:shadow-md'>
						<CardContent className='flex min-h-28 flex-col items-center justify-center gap-3 px-4 py-5 text-center'>
							<IconComponent className='h-10 w-10 text-primary transition-transform duration-200 group-hover:scale-110' />
							<p className='text-sm font-semibold leading-tight'>{name}</p>
						</CardContent>
					</Card>
				</Link>
			</TooltipTrigger>
			<TooltipContent side='top' sideOffset={8}>
				{description}
			</TooltipContent>
		</Tooltip>
	)
}
