'use client'

import { getUILocaleSection, interpolateUILocaleText } from '@helpers'
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Checkbox,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	Input,
	Label,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@shadcn'
import { useLocaleStore } from '@store'
import type { CategoryFieldType, Locale } from '@types'
import { Plus, Trash2, X } from 'lucide-react'

import {
	FIELD_TYPE_OPTIONS,
	FILE_EXTENSION_OPTIONS,
	type ICategoryFieldFormState,
	createEmptyField,
	getValidationNumberValue,
	getValidationStringArray,
	normalizeSortOrder,
} from './category-form.shared'
import localeDictionary from './locale.json'

interface ICategoryFieldsEditorProps {
	activeLocale: Locale
	fields: ICategoryFieldFormState[]
	onChange: (fields: ICategoryFieldFormState[]) => void
}

export const CategoryFieldsEditor = ({ activeLocale, fields, onChange }: ICategoryFieldsEditorProps) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)

	const addField = () => {
		onChange([...fields, createEmptyField(fields.length + 1)])
	}

	const removeField = (index: number) => {
		onChange(
			fields
				.filter((_, currentIndex) => currentIndex !== index)
				.map((field, currentIndex) => ({ ...field, sortOrder: currentIndex + 1 })),
		)
	}

	const updateField = (index: number, patch: Partial<ICategoryFieldFormState>) => {
		onChange(fields.map((field, currentIndex) => (currentIndex === index ? { ...field, ...patch } : field)))
	}

	const updateFieldValidation = (fieldIndex: number, key: string, value: string) => {
		const currentValidation = fields[fieldIndex]?.validation || {}
		const nextValidation = { ...currentValidation }
		const normalizedValue = value.trim()

		if (!normalizedValue) {
			delete nextValidation[key]
		} else {
			const numericValue = Number(normalizedValue)

			if (Number.isFinite(numericValue)) {
				nextValidation[key] = numericValue
			}
		}

		updateField(fieldIndex, { validation: nextValidation })
	}

	const addFileExtension = (fieldIndex: number, extension: string) => {
		const currentValidation = fields[fieldIndex]?.validation || {}
		const currentExtensions = getValidationStringArray(currentValidation, 'extensions').map((item) =>
			item.replace(/^\./, '').toLowerCase(),
		)

		if (currentExtensions.includes(extension)) return

		updateField(fieldIndex, {
			validation: {
				...currentValidation,
				extensions: [...currentExtensions, extension],
			},
		})
	}

	const removeFileExtension = (fieldIndex: number, extension: string) => {
		const currentValidation = fields[fieldIndex]?.validation || {}
		const currentExtensions = getValidationStringArray(currentValidation, 'extensions').map((item) =>
			item.replace(/^\./, '').toLowerCase(),
		)
		const nextExtensions = currentExtensions.filter((item) => item !== extension)
		const nextValidation = { ...currentValidation }

		if (nextExtensions.length) {
			nextValidation.extensions = nextExtensions
		} else {
			delete nextValidation.extensions
		}

		updateField(fieldIndex, { validation: nextValidation })
	}

	const getUnselectedFileExtensions = (validation: Record<string, unknown>) => {
		const selectedExtensions = getValidationStringArray(validation, 'extensions').map((item) =>
			item.replace(/^\./, '').toLowerCase(),
		)

		return FILE_EXTENSION_OPTIONS.filter((option) => !selectedExtensions.includes(option.extension))
	}

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<h3 className='font-semibold'>{t.fieldsTitle}</h3>
				<Button size='sm' type='button' variant='outline' onClick={addField}>
					<Plus className='mr-2 h-4 w-4' />
					{t.addField}
				</Button>
			</div>

			{fields.length ? (
				<div className='space-y-4'>
					{fields.map((field, index) => (
						<Card key={`field-${index}`}>
							<CardHeader className='pb-3'>
								<CardTitle className='text-base'>
									{interpolateUILocaleText(t.fieldTitle, { index: index + 1 })}
								</CardTitle>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='grid gap-4 md:grid-cols-2'>
									<div className='space-y-2'>
										<Label htmlFor={`field-key-${index}`}>Key *</Label>
										<Input
											id={`field-key-${index}`}
											placeholder='publicationUrl'
											value={field.key}
											onChange={(event) => updateField(index, { key: event.target.value })}
										/>
									</div>

									<div className='space-y-2'>
										<Label htmlFor={`field-label-${index}`}>Label *</Label>
										<Input
											id={`field-label-${index}`}
											placeholder='Ссылка на публикацию'
											value={field.label[activeLocale]}
											onChange={(event) =>
												updateField(index, {
													label: {
														...field.label,
														[activeLocale]: event.target.value,
													},
												})
											}
										/>
									</div>
								</div>

								<div className='grid gap-4 md:grid-cols-3'>
									<div className='space-y-2'>
										<Label htmlFor={`field-type-${index}`}>{t.type}</Label>
										<Select
											value={field.type}
											onValueChange={(value: CategoryFieldType) =>
												updateField(index, {
													type: value,
													required: value === 'url' || value === 'file' ? false : field.required,
												})
											}
										>
											<SelectTrigger className='w-full' id={`field-type-${index}`}>
												<SelectValue placeholder={t.type} />
											</SelectTrigger>
											<SelectContent>
												{FIELD_TYPE_OPTIONS.map((type) => (
													<SelectItem key={type} value={type}>
														{type}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className='space-y-2'>
										<Label htmlFor={`field-placeholder-${index}`}>{t.placeholder}</Label>
										<Input
											id={`field-placeholder-${index}`}
											placeholder='https://...'
											value={field.placeholder[activeLocale] || ''}
											onChange={(event) =>
												updateField(index, {
													placeholder: {
														...field.placeholder,
														[activeLocale]: event.target.value,
													},
												})
											}
										/>
									</div>

									<div className='space-y-2'>
										<Label htmlFor={`field-sort-order-${index}`}>{t.sortOrder}</Label>
										<Input
											id={`field-sort-order-${index}`}
											min={1}
											step={1}
											type='number'
											value={field.sortOrder}
											onChange={(event) =>
												updateField(index, { sortOrder: normalizeSortOrder(event.target.value, 1) })
											}
										/>
									</div>
								</div>

								<div className='space-y-2'>
									<Label htmlFor={`field-help-${index}`}>{t.helpText}</Label>
									<Input
										id={`field-help-${index}`}
										placeholder='Подсказка для пользователя'
										value={field.helpText[activeLocale] || ''}
										onChange={(event) =>
											updateField(index, {
												helpText: {
													...field.helpText,
													[activeLocale]: event.target.value,
												},
											})
										}
									/>
								</div>

								{field.type !== 'url' && field.type !== 'file' ? (
									<div className='flex items-center justify-between rounded-md border p-3'>
										<div>
											<p className='text-sm font-medium'>{t.required}</p>
											<p className='text-xs text-muted-foreground'>{t.requiredDescription}</p>
										</div>
										<Checkbox
											checked={field.required}
											onCheckedChange={(checked) => updateField(index, { required: checked === true })}
										/>
									</div>
								) : null}

								{field.type === 'select' ? (
									<div className='space-y-3 rounded-md border p-3'>
										<div className='flex items-center justify-between'>
											<p className='text-sm font-medium'>{t.selectOptions}</p>
											<Button
												size='sm'
												type='button'
												variant='outline'
												onClick={() =>
													updateField(index, {
														options: [...(Array.isArray(field.options) ? field.options : []), ''],
													})
												}
											>
												<Plus className='mr-2 h-4 w-4' />
												{t.addOption}
											</Button>
										</div>

										{(Array.isArray(field.options) ? field.options : []).length ? (
											<div className='space-y-2'>
												{(Array.isArray(field.options) ? field.options : []).map((option, optionIndex) => (
													<div
														key={`field-option-${index}-${optionIndex}`}
														className='flex items-center gap-2'
													>
														<Input
															placeholder={`Опция #${optionIndex + 1}`}
															value={typeof option === 'string' ? option : ''}
															onChange={(event) => {
																const nextOptions = [
																	...(Array.isArray(field.options) ? field.options : []),
																]

																nextOptions[optionIndex] = event.target.value
																updateField(index, { options: nextOptions })
															}}
														/>
														<Button
															size='icon'
															type='button'
															variant='ghost'
															onClick={() =>
																updateField(index, {
																	options: (Array.isArray(field.options) ? field.options : []).filter(
																		(_, currentOptionIndex) => currentOptionIndex !== optionIndex,
																	),
																})
															}
														>
															<X className='h-4 w-4' />
														</Button>
													</div>
												))}
											</div>
										) : (
											<p className='text-sm text-muted-foreground'>{t.selectNeedOption}</p>
										)}
									</div>
								) : null}

								{field.type === 'text' ||
								field.type === 'textarea' ||
								field.type === 'number' ||
								field.type === 'file' ? (
									<div className='space-y-3 rounded-md border p-3'>
										<p className='text-sm font-medium'>{t.validation}</p>

										{field.type === 'text' || field.type === 'textarea' ? (
											<div className='grid gap-3 md:grid-cols-2'>
												<div className='space-y-2'>
													<Label htmlFor={`field-validation-min-length-${index}`}>Min length</Label>
													<Input
														id={`field-validation-min-length-${index}`}
														min={0}
														type='number'
														value={getValidationNumberValue(field.validation, 'minLength')}
														onChange={(event) =>
															updateFieldValidation(index, 'minLength', event.target.value)
														}
													/>
												</div>
												<div className='space-y-2'>
													<Label htmlFor={`field-validation-max-length-${index}`}>Max length</Label>
													<Input
														id={`field-validation-max-length-${index}`}
														min={0}
														type='number'
														value={getValidationNumberValue(field.validation, 'maxLength')}
														onChange={(event) =>
															updateFieldValidation(index, 'maxLength', event.target.value)
														}
													/>
												</div>
											</div>
										) : null}

										{field.type === 'number' ? (
											<div className='grid gap-3 md:grid-cols-2'>
												<div className='space-y-2'>
													<Label htmlFor={`field-validation-min-${index}`}>Min</Label>
													<Input
														id={`field-validation-min-${index}`}
														type='number'
														value={getValidationNumberValue(field.validation, 'min')}
														onChange={(event) => updateFieldValidation(index, 'min', event.target.value)}
													/>
												</div>
												<div className='space-y-2'>
													<Label htmlFor={`field-validation-max-${index}`}>Max</Label>
													<Input
														id={`field-validation-max-${index}`}
														type='number'
														value={getValidationNumberValue(field.validation, 'max')}
														onChange={(event) => updateFieldValidation(index, 'max', event.target.value)}
													/>
												</div>
											</div>
										) : null}

										{field.type === 'file' ? (
											<div className='space-y-4'>
												<Label htmlFor={`field-validation-max-size-${index}`}>Max size (MB)</Label>
												<Input
													id={`field-validation-max-size-${index}`}
													min={1}
													type='number'
													value={getValidationNumberValue(field.validation, 'maxSizeMb')}
													onChange={(event) =>
														updateFieldValidation(index, 'maxSizeMb', event.target.value)
													}
												/>

												<div className='space-y-2'>
													<Label htmlFor={`field-validation-extensions-${index}`}>{t.fileExtensions}</Label>
													<Popover>
														<PopoverTrigger asChild>
															<Button
																className='w-full justify-start font-normal'
																id={`field-validation-extensions-${index}`}
																type='button'
																variant='outline'
															>
																{t.addExtension}
															</Button>
														</PopoverTrigger>
														<PopoverContent align='start' className='w-[340px] p-0'>
															<Command>
																<CommandInput placeholder={t.searchExtension} />
																<CommandEmpty>{t.extensionNotFound}</CommandEmpty>
																<CommandGroup>
																	{getUnselectedFileExtensions(field.validation).map((option) => (
																		<CommandItem
																			key={option.extension}
																			value={`${option.extension} ${option.label}`}
																			onSelect={() => addFileExtension(index, option.extension)}
																		>
																			{option.label}
																		</CommandItem>
																	))}
																</CommandGroup>
															</Command>
														</PopoverContent>
													</Popover>

													<div className='flex flex-wrap gap-2'>
														{getValidationStringArray(field.validation, 'extensions')
															.map((item) => item.replace(/^\./, '').toLowerCase())
															.map((extension) => (
																<Badge
																	key={`${field.key}-${extension}`}
																	className='gap-1'
																	variant='secondary'
																>
																	<span>.{extension}</span>
																	<button
																		aria-label={`Удалить расширение ${extension}`}
																		className='rounded-sm p-0.5 hover:bg-black/10'
																		type='button'
																		onClick={() => removeFileExtension(index, extension)}
																	>
																		<X className='h-3 w-3' />
																	</button>
																</Badge>
															))}
													</div>
												</div>
											</div>
										) : null}
									</div>
								) : null}

								<div className='flex justify-end'>
									<Button size='sm' type='button' variant='destructive' onClick={() => removeField(index)}>
										<Trash2 className='mr-2 h-4 w-4' />
										{t.deleteField}
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<div className='rounded-md border border-dashed p-4 text-sm text-muted-foreground'>
					{t.emptyFields}
				</div>
			)}
		</div>
	)
}
