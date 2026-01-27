import { type FC, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { PageTitle } from '@components'
import { services } from '@services'
import { useMutation } from '@tanstack/react-query'
import type { ITypeResponse } from '@types'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	ButtonGroup,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Separator,
} from '@ui'
import { Pen, Trash } from 'lucide-react'
import { toast } from 'sonner'

import { PointsBadge } from '../components'

interface IProps {
	type: ITypeResponse
}

export const TypeView = ({ type }: IProps) => {
	const { replace } = useRouter()
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	// query
	const { mutate: deleteMutate } = useMutation(services.award.deleteTypeMutationOptions())

	// delete
	const handleDelete = () => {
		if (!type) return
		setIsDeleteDialogOpen(false)

		const toastId = `type-${type.id}-delete`
		const typeName = type.name || 'Критерии оценивания'

		toast.loading(`Удаление ${typeName}...`, { id: toastId })

		deleteMutate(type.id, {
			onSuccess: () => {
				toast.success(`${typeName} успешно удален`, { id: toastId })
				replace('/kpi/types')
			},
			onError: (err) => {
				toast.error(`Произошла ошибка при удалений ${typeName}`, { id: toastId, description: err.message })
			},
		})
	}

	return (
		<section className='p-4 w-full '>
			<PageTitle
				actions={
					<ButtonGroup>
						<Button asChild className='hover:text-primary' size='sm' variant='outline'>
							<Link href={`/kpi/types/${type.id}/edit`}>
								<Pen />
								Редактировать
							</Link>
						</Button>
						<Button
							className='hover:text-destructive'
							size='sm'
							variant='outline'
							onClick={() => setIsDeleteDialogOpen(true)}
						>
							<Trash />
							Удалить
						</Button>
					</ButtonGroup>
				}
				backHref='/kpi/types'
				description='Критерий оценивания, для редактирования перейдите в другую страницу'
			>
				Просмотр {type.name}
			</PageTitle>

			<div className='space-y-6 mt-8'>
				{type.variants.map((variant, index) => (
					<Card key={variant.id} className='border-muted'>
						<CardHeader className='pb-2'>
							<CardTitle className='text-base'>
								Вариант {index + 1}: {variant.name}
							</CardTitle>

							{variant.description && <p className='text-sm text-muted-foreground'>{variant.description}</p>}
						</CardHeader>

						<CardContent className='space-y-4'>
							{/* criteria */}
							{variant.criteria && (
								<div>
									<p className='mb-2 text-sm font-medium'>Критерии</p>

									<ol className='list-[lower-roman] space-y-2 pl-5'>
										{variant.criteria.map((c) => (
											<li key={c.id} className='flex flex-wrap gap-2'>
												<span className='font-medium'>{c.name}</span>

												<PointsBadge points={c.points} />
											</li>
										))}
									</ol>
								</div>
							)}

							{/* bonus */}
							{variant.bonusCriteria?.length ? (
								<>
									<Separator />

									<div>
										<p className='mb-2 text-sm font-medium'>Бонусные критерии</p>

										<ol className='list-[lower-roman] space-y-2 pl-5'>
											{variant.bonusCriteria.map((c) => (
												<li key={c.id} className='flex flex-wrap gap-2'>
													<span className='font-medium'>{c.name}</span>
													<PointsBadge points={c.points} />
												</li>
											))}
										</ol>
									</div>
								</>
							) : null}
						</CardContent>
					</Card>
				))}
			</div>

			<DeleteAlert
				isDeleteDialogOpen={isDeleteDialogOpen}
				setIsDeleteDialogOpen={setIsDeleteDialogOpen}
				onDelete={handleDelete}
			/>
		</section>
	)
}

// delete alert
interface IDeleteAlert {
	isDeleteDialogOpen: boolean
	setIsDeleteDialogOpen: (state: boolean) => void
	onDelete: () => void
}

const DeleteAlert: FC<IDeleteAlert> = ({ isDeleteDialogOpen, setIsDeleteDialogOpen, onDelete }) => {
	return (
		<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Вы уверены?</AlertDialogTitle>
					<AlertDialogDescription>
						Это действие невозможно отменить. Это приведет к необратимому удалению критерии оценивания.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Отмена</AlertDialogCancel>
					<AlertDialogAction variant='destructive' onClick={onDelete}>
						Удалить
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
