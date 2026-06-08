'use client'

import { useMemo, useState } from 'react'

import { getLocaleText, interpolateUILocaleText } from '@helpers'
import { cn } from '@lib'
import {
	Badge,
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@shadcn'
import type { ITypeResponse, Locale } from '@types'
import { Check, ChevronsUpDown, X } from 'lucide-react'

interface IAwardTypesSelectorProps {
	activeLocale: Locale
	awardTypes?: ITypeResponse[]
	value: string[]
	onChange: (value: string[]) => void
	labels: {
		title: string
		selectedCount: string
		triggerPlaceholder: string
		searchPlaceholder: string
		emptyCommand: string
		emptyState: string
		selectedHint: string
		removeAria: string
	}
}

export const AwardTypesSelector = ({ activeLocale, awardTypes, value, onChange, labels }: IAwardTypesSelectorProps) => {
	const [open, setOpen] = useState(false)

	const selectedAwardTypes =
		awardTypes
			?.filter((awardType) => value.includes(awardType.id))
			.sort((a, b) =>
				getLocaleText(a.name, activeLocale).localeCompare(getLocaleText(b.name, activeLocale), activeLocale),
			) || []

	const selectedIdSet = useMemo(() => new Set(value), [value])

	const toggleAwardType = (typeId: string) => {
		onChange(value.includes(typeId) ? value.filter((id) => id !== typeId) : [...value, typeId])
	}

	return (
		<div className='space-y-3'>
			<div className='flex items-center justify-between'>
				<h3 className='font-semibold'>{labels.title}</h3>
				<Badge variant='outline'>{interpolateUILocaleText(labels.selectedCount, { count: value.length })}</Badge>
			</div>

			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button className='w-full justify-between' role='combobox' variant='outline'>
						{awardTypes?.length ? labels.triggerPlaceholder : labels.emptyState}
						<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
					</Button>
				</PopoverTrigger>
				<PopoverContent align='start' className='w-[--radix-popover-trigger-width] p-0'>
					<Command>
						<CommandInput placeholder={labels.searchPlaceholder} />
						<CommandList>
							<CommandEmpty>{labels.emptyCommand}</CommandEmpty>
							<CommandGroup>
								{awardTypes?.map((awardType) => {
									const awardTypeName = getLocaleText(awardType.name, activeLocale)

									return (
										<CommandItem
											key={awardType.id}
											value={awardTypeName}
											onSelect={() => toggleAwardType(awardType.id)}
										>
											<Check
												className={cn(
													'mr-2 h-4 w-4',
													selectedIdSet.has(awardType.id) ? 'opacity-100' : 'opacity-0',
												)}
											/>
											{awardTypeName}
										</CommandItem>
									)
								})}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{selectedAwardTypes.length ? (
				<div className='flex flex-wrap gap-2'>
					{selectedAwardTypes.map((awardType) => {
						const awardTypeName = getLocaleText(awardType.name, activeLocale)

						return (
							<Badge key={awardType.id} className='gap-1 py-1 pr-1.5 pl-2' variant='secondary'>
								<span>{awardTypeName}</span>
								<button
									aria-label={interpolateUILocaleText(labels.removeAria, { name: awardTypeName })}
									className='rounded-sm p-0.5 hover:bg-black/10'
									type='button'
									onClick={() => toggleAwardType(awardType.id)}
								>
									<X className='h-3.5 w-3.5' />
								</button>
							</Badge>
						)
					})}
				</div>
			) : (
				<p className='text-sm text-muted-foreground'>{labels.selectedHint}</p>
			)}
		</div>
	)
}
