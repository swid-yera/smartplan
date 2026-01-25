import type { FC } from 'react'

import Link from 'next/link'

import type { ITypeResponse } from '@types'
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Separator,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@ui'
import { Pencil } from 'lucide-react'

interface IProps {
	types: ITypeResponse[]
	title?: string
	description?: string
}

export const TypesCard: FC<IProps> = ({ types, title, description }) => {
	return (
		<Card className='pb-0 overflow-hidden'>
			<CardHeader>
				<CardTitle>{title || 'Список критериев оценок'}</CardTitle>
				<CardDescription>{description || 'Ознакомиться список критериев оценок'}</CardDescription>
			</CardHeader>

			<CardContent className='p-0'>
				<div className='overflow-x-auto'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='w-full text-center text-xl'>Критерий оценивания</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{types?.map((type) => (
								<TypeRow key={type.id} type={type} />
							))}

							{!types?.length && (
								<TableRow>
									<TableCell className='h-32 text-center text-muted-foreground'>
										Нет критериев оценивания
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	)
}

interface ITypeRow {
	type: ITypeResponse
}

const TypeRow: FC<ITypeRow> = ({ type }) => {
	return (
		<TableRow className='transition-colors hover:bg-muted/40'>
			<TableCell className='p-0'>
				<div className='flex flex-col gap-2 p-4 group relative transition'>
					{/* type name */}
					<h3 className='text-center text-lg font-semibold tracking-tight whitespace-break-spaces'>{type.name}</h3>

					{/* edit button */}
					<Button
						asChild
						className='absolute right-6 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100'
						size='icon-lg'
						variant='default'
					>
						<Link href={`/kpi/types/${type.id}`}>
							<Pencil />
						</Link>
					</Button>

					{/* variants */}
					<ol className='space-y-4'>
						{type.variants.map((variant, index) => (
							<li key={variant.id} className='rounded-lg border bg-background p-4 shadow-sm'>
								{/* variant name */}
								<h4 className='text-center font-semibold'>
									{index + 1}. {variant.name}
								</h4>

								{/* description */}
								{variant.description && (
									<p className='mt-1 text-sm italic text-muted-foreground'>{variant.description}</p>
								)}

								{/* criteria */}
								{variant.criteria && (
									<ol className='mt-3 space-y-2 pl-4'>
										{variant.criteria.map((criteria) => (
											<li key={criteria.id} className='list-[lower-roman] text-sm'>
												<span className='font-medium'>{criteria.name}</span>
												<span className='ml-1 text-muted-foreground'>
													({criteria.points.join('-')}) баллов
												</span>
											</li>
										))}
									</ol>
								)}

								{/* bonus criteria */}
								{variant.bonusCriteria && (
									<>
										<Separator />

										<ol className='mt-3 space-y-2 pl-4'>
											{variant.bonusCriteria.map((criteria) => (
												<li key={criteria.id} className='list-[lower-roman] text-sm'>
													<span className='font-medium'>{criteria.name}</span>
													<span className='ml-1 opacity-80'>({criteria.points.join(', ')})</span>
												</li>
											))}
										</ol>
									</>
								)}
							</li>
						))}
					</ol>
				</div>
			</TableCell>
		</TableRow>
	)
}
