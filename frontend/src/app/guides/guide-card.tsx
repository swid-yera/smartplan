'use client'

import { Badge, Card, CardContent, CardHeader, CardTitle } from '@shadcn'
import type { IGuide } from '@types'
import { BookOpen } from 'lucide-react'

interface IProps {
	guide: IGuide
}

export const GuideCard = ({ guide }: IProps) => {
	return (
		<Card className='hover:shadow-md transition'>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<BookOpen className='h-5 w-5 text-primary' />
					{guide.title}
				</CardTitle>
			</CardHeader>

			<CardContent className='space-y-2'>
				<p className='text-sm text-muted-foreground'>{guide.description}</p>

				<div className='flex items-center gap-2'>
					<Badge variant='secondary'>{guide.category}</Badge>
					<Badge variant='outline'>{guide.level}</Badge>
				</div>

				<p className='text-xs text-muted-foreground'>Обновлено: {guide.updatedAt}</p>
			</CardContent>
		</Card>
	)
}
