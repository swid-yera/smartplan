import { type FC, type ReactNode } from 'react'

import { PageTitle, ResponsibleUsersCard, RupReviewSheets, StatusBadge } from '@components'
import { formatHours, getLocaleText, getUILocaleSection, hasRole, normalizeStudyForm } from '@helpers'
import { ButtonGroup, Tabs, TabsList, TabsTrigger } from '@shadcn'
import { useLocaleStore } from '@store'
import { type IRup, type Locale, RoleEnum, StatusEnum } from '@types'
import { Search, ShieldAlert, Timer } from 'lucide-react'

import { ContactsView, DisciplineView, ExplorationView, TopicsView } from '../components'
import { BasicView } from '../components/view/basic-view'
import localeDictionary from './locale.json'

interface IRupViewProps {
	data: IRup
	role: RoleEnum
	activeLocale: Locale
	localeNotice?: ReactNode
	onActiveLocaleChange: (nextLocale: Locale) => void
	onStatusChange: (
		newStatus: StatusEnum,
		options?: { reason?: string; keyId?: string; userId?: string; password?: string; confirmed?: boolean },
	) => void
	actions?: ReactNode
}

export const RupView: FC<IRupViewProps> = ({
	data,
	role,
	activeLocale,
	localeNotice,
	onActiveLocaleChange,
	onStatusChange,
	actions,
}) => {
	const locale = useLocaleStore((state) => state.locale)
	const localeText = getUILocaleSection(localeDictionary, locale)
	const t = localeText.view

	return (
		<div className='w-full mx-auto relative'>
			<PageTitle
				sticky
				actions={
					<div className='flex items-center gap-2'>
						<Tabs value={activeLocale} onValueChange={(next) => onActiveLocaleChange(next as Locale)}>
							<TabsList>
								<TabsTrigger value='ru'>{t.languageRu}</TabsTrigger>
								<TabsTrigger value='kk'>{t.languageKk}</TabsTrigger>
							</TabsList>
						</Tabs>
						<ButtonGroup>
							{actions}
							<RupReviewSheets data={data} role={role} text={localeText} onStatusChange={onStatusChange} />
						</ButtonGroup>
					</div>
				}
				backHref='/rups'
				description={hasRole(role, RoleEnum.METHODIST) ? t.reviewDescription : t.readOnlyDescription}
			>
				{` ${getLocaleText(data.name, activeLocale) || `${t.titleFallback} `} `}
				<StatusBadge status={data.status} />
			</PageTitle>

			<div className='space-y-6 px-4 py-6'>
				{data.status === StatusEnum.REJECTED && (
					<div className='rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive'>
						<div className='flex items-center gap-2 font-medium'>
							<ShieldAlert className='h-5 w-5' />
							{t.rejectedReasonTitle}
						</div>
						<div className='mt-2 text-sm whitespace-pre-wrap'>{data.reason || t.empty}</div>
					</div>
				)}
				{data.status === StatusEnum.IN_REVIEW && (
					<div className='rounded-lg border border-secondary/50 bg-secondary/5 p-4 text-secondary'>
						<div className='flex items-center gap-2 font-semibold'>
							<Timer className='h-5 w-5' />
							{t.waitingMessage}
						</div>
					</div>
				)}
				{data.status === StatusEnum.DRAFT && (
					<div className='rounded-lg border border-primary/50 bg-primary/5 p-4 text-primary'>
						<div className='flex items-center gap-2 font-semibold'>
							<Search className='h-5 w-5' />
							{t.draftMessage}
						</div>
					</div>
				)}
				{data.status === StatusEnum.APPROVED && (
					<div className='rounded-lg border border-muted-foreground/50 bg-muted-foreground/5 p-4 text-muted-foreground'>
						<div className='flex items-center gap-2 font-semibold'>
							<Search className='h-5 w-5' />
							{t.approvedMessage}
						</div>
					</div>
				)}
				{localeNotice}

				<div className='mt-6 grid gap-6 xl:grid-cols-4 lg:grid-cols-3'>
					<BasicView
						className='xl:col-span-3 lg:col-span-2'
						rows={[
							{
								label: t.moduleName,
								subLabel: t.moduleNameSub,
								value: getLocaleText(data.name, activeLocale),
							},
							{
								label: t.specialty,
								subLabel: t.specialtySub,
								value: getLocaleText(data.groups[0]?.specialty, activeLocale),
							},
							{
								label: t.qualification,
								subLabel: t.qualificationSub,
								value: getLocaleText(data.groups[0]?.qualification, activeLocale),
							},
							{
								label: t.studyForm,
								value: normalizeStudyForm(data.studyForm, activeLocale),
							},
							{
								label: t.totalHours,
								value: formatHours(data.totalHours),
							},
							{
								label: t.credits,
								value: data.totalHours / 24,
							},
							{
								label: t.course,
								value: `${data.course} ${t.courseSuffix}`,
							},
							{
								label: t.group,
								value: data.groups[0].name,
							},
							{
								label: t.developers,
								value: (
									<ul className='list-decimal ml-3'>
										{data.contacts.map((c) => (
											<li key={c.keycloakId}>{`${c.firstName} ${c.lastName}`}</li>
										))}
									</ul>
								),
							},
						]}
						title={t.moduleTitle}
					/>

					<ResponsibleUsersCard
						createdAt={data.createdAt}
						methodist={data.methodist}
						teacher={data.teacher}
						updatedAt={data.updatedAt}
					/>
				</div>

				<ExplorationView activeLocale={activeLocale} data={data} />

				<ContactsView contacts={data.contacts} creatorId={data.teacher.keycloakId} />

				<DisciplineView activeLocale={activeLocale} disciplines={data.disciplines} rupName={data.name} />

				<TopicsView
					activeLocale={activeLocale}
					disciplines={data.disciplines}
					rupId={data.id}
					rupStatus={data.status}
					type={data.type}
				/>
			</div>
		</div>
	)
}
