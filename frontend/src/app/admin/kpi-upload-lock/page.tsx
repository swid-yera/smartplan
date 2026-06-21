'use client'

import { useEffect, useMemo, useState } from 'react'

import { PageTitle, withNavAccess } from '@components'
import { formatDateOnly, getUILocaleSection } from '@helpers'
import { services } from '@services'
import {
	Button,
	Calendar,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Label,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@shadcn'
import { useAuthStore, useLocaleStore } from '@store'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { IKpiUploadExceptionUser, IUser } from '@types'
import { format, isValid, parseISO } from 'date-fns'
import {
	CalendarDays,
	ChevronDown,
	Loader2,
	Mail,
	ShieldAlert,
	ShieldCheck,
	Trash2,
	UserPlus,
	Users,
} from 'lucide-react'
import { toast } from 'sonner'

import localeDictionary from './locale.json'

const Page = () => {
	const locale = useLocaleStore((state) => state.locale)
	const { user } = useAuthStore()
	const t = getUILocaleSection(localeDictionary, locale)
	const [dateValue, setDateValue] = useState('')
	const [exceptionUserIds, setExceptionUserIds] = useState<string[]>([])
	const [searchValue, setSearchValue] = useState('')
	const queryClient = useQueryClient()

	const { data, isLoading } = useQuery({
		...services.kpiSettings.getUploadBlockDateOptions(),
		enabled: !!user,
	})

	const { data: searchUsers = [], isLoading: isUsersLoading } = useQuery({
		...services.user.getAllOptions({ currentPage: 1, pageSize: 20, search: searchValue }),
		enabled: !!user,
		select: (response) => response.data,
	})

	const { mutate, isPending } = useMutation({
		...services.kpiSettings.setUploadBlockDateOptions(),
		onSuccess(updated) {
			setDateValue(updated.blockedAfterDate ?? '')
			setExceptionUserIds(updated.exceptionUserIds ?? [])
			queryClient.invalidateQueries({ queryKey: ['kpi-upload-block-date'] })
			toast.success(updated.blockedAfterDate || updated.exceptionUserIds.length ? t.saved : t.cleared)
		},
		onError() {
			toast.error(t.saveError)
		},
	})

	useEffect(() => {
		setDateValue(data?.blockedAfterDate ?? '')
		setExceptionUserIds(data?.exceptionUserIds ?? [])
	}, [data?.blockedAfterDate, data?.exceptionUserIds])

	const selectedUsers = useMemo(() => {
		const byId = new Map<string, IKpiUploadExceptionUser>()

		for (const selectedUser of data?.exceptionUsers ?? []) {
			byId.set(selectedUser.keycloakId, selectedUser)
		}

		for (const candidate of searchUsers) {
			if (exceptionUserIds.includes(candidate.keycloakId)) {
				byId.set(candidate.keycloakId, toExceptionUser(candidate))
			}
		}

		return exceptionUserIds
			.map((id) => byId.get(id))
			.filter((value): value is IKpiUploadExceptionUser => Boolean(value))
	}, [data?.exceptionUsers, exceptionUserIds, searchUsers])

	const formattedDate = dateValue ? formatDateOnly(dateValue, locale) : ''
	const selectedDate = dateValue ? parseISO(dateValue) : undefined
	const hasSelectedDate = Boolean(selectedDate && isValid(selectedDate))

	const handleSave = () => {
		mutate({
			blockedAfterDate: dateValue.trim() ? dateValue : null,
			exceptionUserIds,
		})
	}

	const handleClear = () => {
		setDateValue('')
		setExceptionUserIds([])
		mutate({ blockedAfterDate: null, exceptionUserIds: [] })
	}

	const handleAddException = (nextUser: IUser) => {
		setExceptionUserIds((current) => {
			if (current.includes(nextUser.keycloakId)) {
				return current
			}
			return [...current, nextUser.keycloakId]
		})
	}

	const handleRemoveException = (userId: string) => {
		setExceptionUserIds((current) => current.filter((id) => id !== userId))
	}

	return (
		<section className='mx-auto w-full max-w-4xl space-y-6 p-4'>
			<PageTitle backHref='back' description={t.description}>
				{t.title}
			</PageTitle>

			<Card className='overflow-hidden border-border/60'>
				<CardHeader className='space-y-2'>
					<CardTitle className='flex items-center gap-2 text-xl'>
						<ShieldAlert className='h-5 w-5 text-primary' />
						{t.title}
					</CardTitle>
					<CardDescription>{t.description}</CardDescription>
				</CardHeader>

				<CardContent className='space-y-6'>
					<div className='space-y-2'>
						<Label>{t.dateLabel}</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									className='w-full justify-between font-normal'
									disabled={isLoading || isPending}
									type='button'
									variant='outline'
								>
									<CalendarDays data-icon='inline-start' />
									<span className='truncate'>
										{hasSelectedDate ? format(selectedDate as Date, 'dd.MM.yyyy') : t.dateUnset}
									</span>
									<ChevronDown data-icon='inline-end' />
								</Button>
							</PopoverTrigger>
							<PopoverContent align='start' className='w-auto overflow-hidden p-0'>
								<Calendar
									captionLayout='dropdown'
									defaultMonth={hasSelectedDate ? (selectedDate as Date) : undefined}
									mode='single'
									selected={hasSelectedDate ? (selectedDate as Date) : undefined}
									onSelect={(nextDate) => setDateValue(nextDate ? format(nextDate, 'yyyy-MM-dd') : '')}
								/>
							</PopoverContent>
						</Popover>
						<p className='text-sm text-muted-foreground'>{t.dateHint}</p>
					</div>

					<div className='space-y-3'>
						<div className='flex items-center justify-between gap-3'>
							<div className='space-y-1'>
								<Label>{t.exceptionsLabel}</Label>
								<p className='text-sm text-muted-foreground'>{t.exceptionsHint}</p>
							</div>
							<UserSelector
								isLoading={isUsersLoading}
								searchValue={searchValue}
								selectedUserIds={exceptionUserIds}
								text={t}
								users={searchUsers}
								onSearchValueChange={setSearchValue}
								onSelect={handleAddException}
							/>
						</div>

						<div className='rounded-2xl border border-dashed'>
							{selectedUsers.length ? (
								<div className='divide-y'>
									{selectedUsers.map((selectedUser) => (
										<div
											key={selectedUser.keycloakId}
											className='flex items-center justify-between gap-3 p-4'
										>
											<div className='min-w-0'>
												<p className='truncate font-medium'>{formatUserName(selectedUser)}</p>
												<p className='truncate text-sm text-muted-foreground'>
													{selectedUser.username}
													{selectedUser.email ? ` • ${selectedUser.email}` : ''}
												</p>
											</div>
											<Button
												aria-label={t.removeException}
												disabled={isPending}
												size='icon'
												type='button'
												variant='ghost'
												onClick={() => handleRemoveException(selectedUser.keycloakId)}
											>
												<Trash2 className='h-4 w-4' />
											</Button>
										</div>
									))}
								</div>
							) : (
								<div className='flex items-center gap-3 p-4 text-sm text-muted-foreground'>
									<Users className='h-4 w-4 shrink-0' />
									<span>{t.exceptionsEmpty}</span>
								</div>
							)}
						</div>
					</div>

					<div className='rounded-2xl border border-dashed p-4 text-sm text-muted-foreground'>
						<div className='flex items-start gap-2'>
							<ShieldCheck className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
							<p>
								{dateValue
									? t.preview
											.replace('{date}', formattedDate || dateValue)
											.replace('{count}', String(exceptionUserIds.length))
									: t.dateUnset}
							</p>
						</div>
					</div>

					<div className='flex flex-col gap-3 sm:flex-row'>
						<Button disabled={isLoading || isPending} onClick={handleSave}>
							{isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
							{t.save}
						</Button>
						<Button
							disabled={isLoading || isPending || (!dateValue && exceptionUserIds.length === 0)}
							variant='outline'
							onClick={handleClear}
						>
							{t.clear}
						</Button>
					</div>
				</CardContent>
			</Card>
		</section>
	)
}

type UserSelectorProps = {
	isLoading: boolean
	onSearchValueChange: (value: string) => void
	onSelect: (user: IUser) => void
	searchValue: string
	selectedUserIds: string[]
	text: Record<string, string>
	users: IUser[]
}

const UserSelector = ({
	isLoading,
	onSearchValueChange,
	onSelect,
	searchValue,
	selectedUserIds,
	text,
	users,
}: UserSelectorProps) => {
	const [open, setOpen] = useState(false)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button className='min-w-52 justify-between' disabled={isLoading} type='button' variant='outline'>
					<UserPlus className='mr-2 h-4 w-4' />
					{text.addException}
					<ChevronDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
				</Button>
			</PopoverTrigger>
			<PopoverContent align='end' className='w-[360px] p-0'>
				<Command shouldFilter={false}>
					<CommandInput
						placeholder={text.searchPlaceholder}
						value={searchValue}
						onValueChange={onSearchValueChange}
					/>
					<CommandList className='max-h-[300px]'>
						{!isLoading && users.length === 0 ? <CommandEmpty>{text.usersNotFound}</CommandEmpty> : null}
						<CommandGroup heading={text.availableUsers}>
							{users.map((candidate) => {
								const isSelected = selectedUserIds.includes(candidate.keycloakId)

								return (
									<CommandItem
										key={candidate.keycloakId}
										disabled={isSelected}
										value={candidate.keycloakId}
										onSelect={() => {
											onSelect(candidate)
											setOpen(false)
										}}
									>
										<div className='flex min-w-0 flex-1 flex-col'>
											<span className='truncate font-medium'>{formatUserName(candidate)}</span>
											<span className='truncate text-xs text-muted-foreground'>
												{candidate.username}
												{candidate.email ? ` • ${candidate.email}` : ''}
											</span>
										</div>
										{isSelected ? <Mail className='h-3.5 w-3.5 text-primary' /> : null}
									</CommandItem>
								)
							})}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}

const formatUserName = (user: Pick<IKpiUploadExceptionUser, 'firstName' | 'lastName' | 'username'>) => {
	const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
	return fullName || user.username
}

const toExceptionUser = (user: IUser): IKpiUploadExceptionUser => ({
	keycloakId: user.keycloakId,
	username: user.username,
	email: user.email ?? '',
	firstName: user.firstName,
	lastName: user.lastName,
})

export default withNavAccess(Page)
