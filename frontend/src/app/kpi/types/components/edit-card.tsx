import { type FC, useState } from 'react'

import type { ICreateTypesRequest, ITypeResponse, IVariantRequest } from '@types'
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Separator,
} from '@ui'
import { Plus } from 'lucide-react'

import { VariantEdit } from './variant-edit'

interface IProps {
	onSubmit: (data: ICreateTypesRequest) => void
	type?: ITypeResponse
}

export const EditCard: FC<IProps> = ({ onSubmit, type }) => {
	const [name, setName] = useState(type?.name || '')
	const [variants, setVariants] = useState<IVariantRequest[]>(type?.variants || [])

	const addVariant = () => {
		setVariants((prev) => [
			...prev,
			{
				name: '',
				description: '',
				criteria: [],
				bonusCriteria: [],
			},
		])
	}

	const handleSubmit = () => {
		// check
		if (!variants.length || !name) return

		onSubmit({ name, variants })
	}

	return (
		<Card className='mt-6'>
			<CardHeader>
				<CardTitle>Создайте новую критерию оценивания</CardTitle>
				<CardDescription>Создайте варианты оценивания и критерии с баллами</CardDescription>
			</CardHeader>

			<CardContent className='space-y-6'>
				{/* type name */}
				<div className='space-y-2'>
					<Label>Название критерия</Label>
					<Input
						placeholder='Например: Оценка практической работы'
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
				</div>

				<Separator />

				{/* variants */}
				<div className='space-y-4'>
					<div className='flex items-center justify-between'>
						<h3 className='font-semibold'>Варианты оценивания</h3>
						<Button size='sm' variant='outline' onClick={addVariant}>
							<Plus className='mr-2 h-4 w-4' />
							Добавить вариант
						</Button>
					</div>

					{variants.map((variant, index) => (
						<VariantEdit
							key={index}
							index={index}
							variant={variant}
							onChange={(v) => setVariants((prev) => prev.map((item, i) => (i === index ? v : item)))}
							onDelete={() => setVariants((prev) => prev.filter((_, i) => i !== index))}
						/>
					))}

					{!variants.length && (
						<p className='text-sm text-muted-foreground'>Добавьте хотя бы один вариант оценивания</p>
					)}
				</div>
			</CardContent>

			<CardFooter className='flex justify-end gap-2'>
				<Button variant='outline'>Отмена</Button>
				<Button onClick={handleSubmit}>Сохранить</Button>
			</CardFooter>
		</Card>
	)
}
