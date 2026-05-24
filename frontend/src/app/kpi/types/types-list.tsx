import type { FC } from 'react'

import Link from 'next/link'

import { getLocaleText } from '@helpers'
import { Button, Card, CardContent, CardHeader, CardTitle, Separator } from '@shadcn'
import { useLocaleStore } from '@store'
import type { ITypeResponse } from '@types'
import { Pencil } from 'lucide-react'

interface IProps {
	types: ITypeResponse[]
	title?: string
	description?: string
}

export const TypesList: FC<IProps> = ({ types, title, description }) => {
	const locale = useLocaleStore((state) => state.locale)

	return (
		<section className='space-y-6'>
			{/* header */}
			<div className='space-y-1'>
				<h2 className='text-2xl font-semibold tracking-tight'>{title || 'Список критериев оценок'}</h2>
				<p className='text-muted-foreground'>{description || 'Ознакомьтесь со списком критериев оценивания'}</p>
			</div>

			{/* content */}
			{types?.length ? (
				<div className='grid gap-6 sm:grid-cols-1 lg:grid-cols-2'>
					{types.map((type) => (
						<TypeCard key={type.id} locale={locale} type={type} />
					))}
				</div>
			) : (
				<div className='flex h-40 items-center justify-center rounded-lg border border-dashed text-muted-foreground'>
					Нет критериев оценивания
				</div>
			)}
		</section>
	)
}

interface ITypeCardProps {
	locale: 'ru' | 'kk'
	type: ITypeResponse
}

const TypeCard: FC<ITypeCardProps> = ({ locale, type }) => {
	return (
		<Card className='group relative'>
			<CardHeader className='pb-3'>
				<CardTitle className='text-lg text-center'>{getLocaleText(type.name, locale)}</CardTitle>

				{/* edit */}
				<Button
					asChild
					className='absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100'
					size='icon'
					variant='ghost'
				>
					<Link href={`/kpi/types/${type.id}`}>
						<Pencil className='h-4 w-4' />
					</Link>
				</Button>
			</CardHeader>

			<CardContent className='space-y-4'>
				{type.variants.map((variant, index) => (
					<div key={variant.id} className='rounded-lg border bg-muted/30 p-4'>
						{/* variant title */}
						<h4 className='text-center font-semibold'>
							{index + 1}. {getLocaleText(variant.name, locale)}
						</h4>

						{/* description */}
						{variant.description && (
							<p className='mt-1 text-sm italic text-muted-foreground'>
								{getLocaleText(variant.description, locale)}
							</p>
						)}

						{/* criteria */}
						{variant.criteria?.length > 0 && (
							<ol className='mt-3 space-y-2 pl-4'>
								{variant.criteria.map((criteria) => (
									<li key={criteria.id} className='list-[lower-roman] text-sm'>
										<span className='font-medium'>{getLocaleText(criteria.name, locale)}</span>
										<span className='ml-1 text-muted-foreground'>({criteria.points.join('-')}) баллов</span>
									</li>
								))}
							</ol>
						)}

						{/* bonus criteria */}
						{variant.bonusCriteria && variant.bonusCriteria.length > 0 && (
							<>
								<Separator className='my-3' />

								<ol className='space-y-2 pl-4'>
									{variant.bonusCriteria.map((criteria) => (
										<li key={criteria.id} className='list-[lower-roman] text-sm'>
											<span className='font-medium'>{getLocaleText(criteria.name, locale)}</span>
											<span className='ml-1 opacity-80'>({criteria.points.join(', ')})</span>
										</li>
									))}
								</ol>
							</>
						)}
					</div>
				))}
			</CardContent>
		</Card>
	)
}
