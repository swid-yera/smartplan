'use client'

import { type FC, useState } from 'react'

import { createLocaleText, getLocaleText, getUILocaleSection } from '@helpers'
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
} from '@shadcn'
import { useLocaleStore } from '@store'
import type { ICreateTypesRequest, ITypeResponse, Locale } from '@types'
import { Plus } from 'lucide-react'

import localeDictionary from './locale.json'
import { type ILocalizedDraft, type IVariantForm, VariantEdit } from './variant-edit'

interface IProps {
	activeLocale: Locale
	onSubmit: (data: ICreateTypesRequest) => void
	type?: ITypeResponse
}

export const EditCard: FC<IProps> = ({ activeLocale, onSubmit, type }) => {
	const locale = useLocaleStore((state) => state.locale)
	const t = getUILocaleSection(localeDictionary, locale)
	const [name, setName] = useState<ILocalizedDraft>({
		ru: getLocaleText(type?.name, 'ru'),
		kk: getLocaleText(type?.name, 'kk'),
	})
	const [variants, setVariants] = useState<IVariantForm[]>(
		() =>
			type?.variants.map((v) => ({
				name: {
					ru: getLocaleText(v.name, 'ru'),
					kk: getLocaleText(v.name, 'kk'),
				},
				description: {
					ru: getLocaleText(v.description, 'ru'),
					kk: getLocaleText(v.description, 'kk'),
				},
				criteria:
					v.criteria?.map((criteria) => ({
						...criteria,
						name: {
							ru: getLocaleText(criteria.name, 'ru'),
							kk: getLocaleText(criteria.name, 'kk'),
						},
					})) || [],
				bonusCriteria:
					v.bonus_criteria?.map((criteria) => ({
						...criteria,
						name: {
							ru: getLocaleText(criteria.name, 'ru'),
							kk: getLocaleText(criteria.name, 'kk'),
						},
					})) || [],
			})) || [],
	)

	const addVariant = () => {
		setVariants((prev) => [
			...prev,
			{
				name: {
					ru: '',
					kk: '',
				},
				description: {
					ru: '',
					kk: '',
				},
				criteria: [],
				bonusCriteria: [],
			},
		])
	}

	const handleSubmit = () => {
		// check
		if (!variants.length || (!name.ru.trim() && !name.kk.trim())) return

		onSubmit({
			name: createLocaleText(name.ru, name.kk),
			variants: variants.map((variant) => ({
				name: createLocaleText(variant.name.ru, variant.name.kk),
				description:
					variant.description.ru.trim() || variant.description.kk.trim()
						? createLocaleText(variant.description.ru, variant.description.kk)
						: null,
				criteria: variant.criteria.map((criteria) => ({
					...criteria,
					name: createLocaleText(criteria.name.ru, criteria.name.kk),
				})),
				bonus_criteria: variant.bonusCriteria.map((criteria) => ({
					...criteria,
					name: createLocaleText(criteria.name.ru, criteria.name.kk),
				})),
			})),
		})
	}

	return (
		<Card className='mt-6'>
			<CardHeader>
				<CardTitle>{t.cardTitle}</CardTitle>
				<CardDescription>{t.cardDescription}</CardDescription>
			</CardHeader>

			<CardContent className='space-y-6'>
				{/* type name */}
				<div className='space-y-2'>
					<Label>{t.nameLabel}</Label>
					<Input
						placeholder={t.namePlaceholder}
						value={name[activeLocale]}
						onChange={(e) =>
							setName((prev) => ({
								...prev,
								[activeLocale]: e.target.value,
							}))
						}
					/>
				</div>

				<Separator />

				{/* variants */}
				<div className='space-y-4'>
					<div className='flex items-center justify-between'>
						<h3 className='font-semibold'>{t.variantsTitle}</h3>
						<Button size='sm' variant='outline' onClick={addVariant}>
							<Plus className='mr-2 h-4 w-4' />
							{t.addVariant}
						</Button>
					</div>

					{variants.map((variant, index) => (
						<VariantEdit
							key={index}
							index={index}
							locale={activeLocale}
							variant={variant}
							onChange={(v) => setVariants((prev) => prev.map((item, i) => (i === index ? v : item)))}
							onDelete={() => setVariants((prev) => prev.filter((_, i) => i !== index))}
						/>
					))}

					{!variants.length && <p className='text-sm text-muted-foreground'>{t.emptyVariants}</p>}
				</div>
			</CardContent>

			<CardFooter className='flex justify-end gap-2'>
				<Button asChild variant='outline'>
					<a href='/kpi/types'>{t.cancel}</a>
				</Button>
				<Button onClick={handleSubmit}>{t.save}</Button>
			</CardFooter>
		</Card>
	)
}
