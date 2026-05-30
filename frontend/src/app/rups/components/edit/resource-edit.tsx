'use client'

import { getUILocaleSection } from '@helpers'
import { getLocaleText } from '@helpers'
import { cn } from '@lib'
import { getLocalizedValue, updateLocaleText } from '../../rup-localization'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@shadcn'
import { useLocaleStore } from '@store'
import type { Locale, LocaleText } from '@types'
import { LinkIcon, Trash } from 'lucide-react'
import {
	type ArrayPath,
	type FieldValues,
	type Path,
	type PathValue,
	useFieldArray,
	useFormContext,
} from 'react-hook-form'
import localeDictionary from './locale.json'

type ResourceListValues = FieldValues & {
	[key: string]: { name: LocaleText; link?: string }[] | undefined
}

interface IProps<T extends ResourceListValues> {
	name: ArrayPath<T>
	title: string
	description: React.ReactNode
	label: string
	placeholder: string
	buttonText: string
	activeLocale: Locale
}

export function ResourceEdit<T extends ResourceListValues>({
	name,
	title,
	description,
	label,
	placeholder,
	buttonText,
	activeLocale,
}: IProps<T>) {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const { control, watch } = useFormContext<T>()
	const { fields, append, remove } = useFieldArray({
		control,
		name,
	})

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4 text-sm'>
				<FormItem>
					<FormLabel>{label}</FormLabel>

					<ol className='space-y-2 list-none'>
						{fields.map((field, index) => {
							const currentLink = watch(`${name}.${index}.link` as Path<T>)

							return (
								<li key={field.id} className='flex items-start gap-2'>
									<div className='pt-2 text-muted-foreground w-4 text-xs'>{index + 1}.</div>

									<FormField
										control={control}
										name={`${name}.${index}.name` as Path<T>}
										render={({ field }) => (
											<FormItem className='flex-1'>
												<FormControl>
													<Input
														placeholder={placeholder}
														value={getLocalizedValue(field.value as LocaleText, activeLocale)}
														onChange={(event) =>
															field.onChange(
																updateLocaleText(
																	field.value as LocaleText,
																	activeLocale,
																	event.target.value,
																),
															)
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={control}
										name={`${name}.${index}.link` as Path<T>}
										render={({ field }) => (
											<Popover>
												<PopoverTrigger asChild>
													<Button
														className={cn(currentLink && 'bg-secondary')}
														size='icon'
														type='button'
														variant={currentLink ? 'default' : 'outline'}
													>
														<LinkIcon className='h-4 w-4' />
													</Button>
												</PopoverTrigger>
												<PopoverContent className='w-80'>
													<div className='grid gap-4'>
														<div className='space-y-2'>
															<h4 className='font-medium leading-none'>{t.resource.addLink}</h4>
															<p className='text-sm text-muted-foreground'>{t.resource.insertUrl}</p>
														</div>
														<div className='grid gap-2'>
															<FormControl>
																<Input
																	placeholder='https://example.com'
																	{...field}
																	value={field.value || ''}
																/>
															</FormControl>
														</div>
													</div>
												</PopoverContent>
											</Popover>
										)}
									/>

									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button
												className='text-destructive hover:bg-destructive/10'
												size='icon'
												type='button'
												variant='outline'
											>
												<Trash className='h-4 w-4' />
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>{t.resource.confirmTitle}</AlertDialogTitle>
												<AlertDialogDescription>
													{t.resource.confirmPrefix}
													<strong className='text-foreground ml-1'>
														{getLocaleText(
															(fields[index] as { name?: LocaleText }).name,
															activeLocale,
														) || `№${index + 1}`}
													</strong>
													{t.resource.confirmSuffix}
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>{t.resource.cancel}</AlertDialogCancel>
												<AlertDialogAction
													className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
													onClick={() => remove(index)}
												>
													{t.resource.delete}
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</li>
							)
						})}
					</ol>

					<Button
						className='mt-2 w-min'
						size='sm'
						type='button'
						variant='outline'
						onClick={() =>
							append(
								{
									name: { ru: '', kz: '' },
									link: '',
								} as PathValue<T, ArrayPath<T>>,
							)
						}
					>
						{buttonText}
					</Button>
				</FormItem>
			</CardContent>
		</Card>
	)
}
