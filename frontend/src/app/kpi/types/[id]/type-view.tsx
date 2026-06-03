import { type FC, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { PageTitle } from '@components'
import { getLocaleText, getUILocaleSection, interpolateUILocaleText } from '@helpers'
import { services } from '@services'
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
	Tabs,
	TabsList,
	TabsTrigger,
} from '@shadcn'
import { useMutation } from '@tanstack/react-query'
import type { ITypeResponse, Locale } from '@types'
import { Pen, Trash } from 'lucide-react'
import { toast } from 'sonner'

import { PointsBadge } from '../components'
import localeDictionary from './locale.json'

interface IProps {
	type: ITypeResponse
}

export const TypeView = ({ type }: IProps) => {
	const { push } = useRouter()
	const [activeLocale, setActiveLocale] = useState<Locale>('ru')
	const t = getUILocaleSection(localeDictionary, activeLocale)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const backHref = '/kpi/types'

	// query
	const { mutate: deleteMutate } = useMutation(services.award.deleteTypeMutationOptions())

	// delete
	const handleDelete = () => {
		if (!type) return
		setIsDeleteDialogOpen(false)

		const toastId = `type-${type.id}-delete`
		const typeName = getLocaleText(type.name, activeLocale) || t.defaultTypeName

		toast.loading(interpolateUILocaleText(t.toastDeleting, { name: typeName }), { id: toastId })

		deleteMutate(type.id, {
			onSuccess: () => {
				toast.success(interpolateUILocaleText(t.toastDeleted, { name: typeName }), { id: toastId })
				push(backHref)
			},
			onError: (err) => {
				toast.error(interpolateUILocaleText(t.toastError, { name: typeName }), {
					id: toastId,
					description: err.message,
				})
			},
		})
	}

	return (
		<section className='p-4 w-full '>
			<PageTitle
				sticky
				actions={
					<div className='flex flex-col gap-2 items-end justify-center'>
						<ButtonGroup>
							<Button asChild className='hover:text-primary' size='sm' variant='outline'>
								<Link href={`/kpi/types/${type.id}/edit`}>
									<Pen />
									{t.edit}
								</Link>
							</Button>
							<Button
								className='hover:text-destructive'
								size='sm'
								variant='outline'
								onClick={() => setIsDeleteDialogOpen(true)}
							>
								<Trash />
								{t.delete}
							</Button>
						</ButtonGroup>

						<Tabs value={activeLocale} onValueChange={(value) => setActiveLocale(value as Locale)}>
							<TabsList>
								<TabsTrigger value='ru'>{t.langRu}</TabsTrigger>
								<TabsTrigger value='kk'>{t.langKk}</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>
				}
				backHref={backHref}
				description={t.description}
			>
				{interpolateUILocaleText(t.title, { name: getLocaleText(type.name, activeLocale) })}
			</PageTitle>

			<div className='space-y-6 mt-8'>
				{type.variants.map((variant, index) => (
					<Card key={variant.id} className='border-muted'>
						<CardHeader className='pb-2'>
							<CardTitle className='text-base'>
								{interpolateUILocaleText(t.variant, {
									index: index + 1,
									name: getLocaleText(variant.name, activeLocale),
								})}
							</CardTitle>

							{variant.description && (
								<p className='text-sm text-muted-foreground'>
									{getLocaleText(variant.description, activeLocale)}
								</p>
							)}
						</CardHeader>

						<CardContent className='space-y-4'>
							{/* criteria */}
							{variant.criteria && (
								<div>
									<p className='mb-2 text-sm font-medium'>{t.criteria}</p>

									<ol className='list-[lower-roman] space-y-2 pl-5'>
										{variant.criteria.map((c) => (
											<li key={c.id} className='flex flex-wrap gap-2'>
												<span className='font-medium'>{getLocaleText(c.name, activeLocale)}</span>

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
										<p className='mb-2 text-sm font-medium'>{t.bonusCriteria}</p>

										<ol className='list-[lower-roman] space-y-2 pl-5'>
											{variant.bonusCriteria.map((c) => (
												<li key={c.id} className='flex flex-wrap gap-2'>
													<span className='font-medium'>{getLocaleText(c.name, activeLocale)}</span>
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
				t={t}
				onDelete={handleDelete}
			/>
		</section>
	)
}

// delete alert
interface IDeleteAlert {
	isDeleteDialogOpen: boolean
	setIsDeleteDialogOpen: (state: boolean) => void
	t: Record<string, string>
	onDelete: () => void
}

const DeleteAlert: FC<IDeleteAlert> = ({ isDeleteDialogOpen, setIsDeleteDialogOpen, onDelete, t }) => {
	return (
		<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t.deleteTitle}</AlertDialogTitle>
					<AlertDialogDescription>{t.deleteDescription}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t.cancel}</AlertDialogCancel>
					<AlertDialogAction variant='destructive' onClick={onDelete}>
						{t.delete}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
