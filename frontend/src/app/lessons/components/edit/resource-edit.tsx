import { Button, Card, CardContent, CardHeader, CardTitle, FormField, Input } from '@shadcn'
import { Plus, Trash2 } from 'lucide-react'
import { type FieldValues, type Path, useFormContext } from 'react-hook-form'

interface IResourceItem {
	name: string
	link: string
}

interface IProps<T extends FieldValues> {
	title: string
	icon: React.ReactNode
	fields: IResourceItem[]
	append: () => void
	remove: (index: number) => void
	namePrefix: string
}

export function LessonResourceEdit<T extends FieldValues>({
	title,
	icon,
	fields,
	append,
	remove,
	namePrefix,
}: IProps<T>) {
	const { control } = useFormContext<T>()

	return (
		<Card>
			<CardHeader className='flex flex-row items-center justify-between'>
				<CardTitle className='flex items-center gap-2 text-base'>
					{icon} {title}
				</CardTitle>
				<Button size='sm' type='button' variant='ghost' onClick={append}>
					<Plus className='w-4 h-4' />
				</Button>
			</CardHeader>
			<CardContent className='space-y-3'>
				{fields.map((field, index) => (
					<div key={index} className='flex gap-2'>
						<FormField
							control={control}
							name={`${namePrefix}.${index}.name` as Path<T>}
							render={({ field }) => <Input {...field} className='flex-1' placeholder='Название' />}
						/>
						<FormField
							control={control}
							name={`${namePrefix}.${index}.link` as Path<T>}
							render={({ field }) => <Input {...field} className='flex-2' placeholder='Ссылка' />}
						/>
						<Button size='icon' variant='ghost' onClick={() => remove(index)}>
							<Trash2 className='w-4 h-4' />
						</Button>
					</div>
				))}
			</CardContent>
		</Card>
	)
}
