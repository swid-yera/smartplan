import { PermissionCodeEnum, RoleEnum } from '@types'
import {
	Award,
	BookCopy,
	BookOpen,
	ChartBar,
	ClipboardClock,
	FilePlus,
	Film,
	Group,
	Headset,
	LayoutDashboard,
	LibraryBig,
	ListCheck,
	type LucideIcon,
	Medal,
	Notebook,
	PenIcon,
	Ribbon,
	ShieldUser,
	Users,
} from 'lucide-react'

export interface INav {
	id: string
	titleKey: string
	url: string
	icon: LucideIcon
	defaultOpen?: boolean
	roles?: RoleEnum[]
	permissions?: PermissionCodeEnum[]
	items?: INav[]
}

export const navMain: INav[] = [
	{
		id: 'dashboard',
		titleKey: 'dashboard',
		url: '/dashboard',
		icon: LayoutDashboard,
		roles: [RoleEnum.TEACHER, RoleEnum.METHODIST, RoleEnum.SPECIAL],
	},
	{
		id: 'rups',
		titleKey: 'rups',
		url: '/rups',
		icon: PenIcon,
		permissions: [PermissionCodeEnum.RUP_VIEW],
		items: [
			{
				id: 'rups-my',
				icon: LibraryBig,
				titleKey: 'rupsMy',
				url: '/rups/my',
				permissions: [PermissionCodeEnum.RUP_VIEW],
			},
			{
				id: 'rups-create',
				icon: FilePlus,
				titleKey: 'rupsCreate',
				url: '/rups/create',
				permissions: [PermissionCodeEnum.RUP_MANAGE],
			},
			{
				id: 'rups-guides',
				icon: Film,
				titleKey: 'rupsGuides',
				url: '/rups/guides',
				permissions: [PermissionCodeEnum.RUP_VIEW],
			},
			{
				id: 'rups-all',
				icon: BookCopy,
				titleKey: 'rupsAll',
				url: '/rups/all',
				permissions: [PermissionCodeEnum.RUP_MANAGE],
			},
			{
				id: 'rups-review',
				icon: ClipboardClock,
				titleKey: 'rupsReview',
				url: '/rups/review',
				permissions: [PermissionCodeEnum.RUP_MANAGE],
			},
		],
	},
	{
		id: 'lessons',
		titleKey: 'lessons',
		url: '/lessons',
		icon: BookOpen,
		roles: [RoleEnum.TEACHER, RoleEnum.METHODIST],
		items: [
			{
				id: 'lessons-my',
				icon: Notebook,
				titleKey: 'lessonsMy',
				url: '/lessons/my',
				roles: [RoleEnum.TEACHER, RoleEnum.METHODIST],
			},
		],
	},
	{
		id: 'kpi',
		titleKey: 'kpi',
		url: '/kpi',
		icon: Award,
		permissions: [PermissionCodeEnum.KPI_VIEW],
		items: [
			{
				id: 'kpi-my',
				icon: Medal,
				titleKey: 'kpiMy',
				url: '/kpi/my',
				permissions: [PermissionCodeEnum.KPI_VIEW],
			},
			{
				id: 'kpi-entry',
				icon: FilePlus,
				titleKey: 'kpiEntry',
				url: '/kpi/entry',
				permissions: [PermissionCodeEnum.KPI_VIEW],
			},
			{
				id: 'kpi-all',
				icon: Ribbon,
				titleKey: 'kpiAll',
				url: '/kpi/all',
				permissions: [PermissionCodeEnum.KPI_MANAGE],
			},
			{
				id: 'kpi-rating',
				icon: ChartBar,
				titleKey: 'kpiRating',
				url: '/kpi/rating',
				permissions: [PermissionCodeEnum.KPI_MANAGE],
			},
			{
				id: 'kpi-guides',
				icon: Film,
				titleKey: 'kpiGuides',
				url: '/kpi/guides',
			},
		],
	},
	// {
	// 	id: 'groups',
	// 	titleKey: 'groups',
	// 	url: '/groups',
	// 	icon: Group,
	// },
	{
		id: 'admin',
		icon: ShieldUser,
		titleKey: 'admin',
		url: '/admin',
		defaultOpen: false,
		permissions: [PermissionCodeEnum.RUP_FULL, PermissionCodeEnum.KPI_FULL],
		items: [
			{
				id: 'users',
				titleKey: 'users',
				url: '/users',
				icon: Users,
				permissions: [PermissionCodeEnum.RUP_FULL, PermissionCodeEnum.KPI_FULL],
			},
			{
				id: 'settings',
				titleKey: 'settings',
				url: '/settings',
				icon: Group,
				permissions: [PermissionCodeEnum.RUP_FULL, PermissionCodeEnum.KPI_FULL],
			},
			{
				id: 'kpi-categories',
				titleKey: 'kpiCategories',
				url: '/kpi/categories',
				icon: ListCheck,
				permissions: [PermissionCodeEnum.RUP_FULL, PermissionCodeEnum.KPI_FULL],
			},
			{
				id: 'kpi-criteria',
				titleKey: 'kpiCriteria',
				url: '/kpi/types',
				icon: ListCheck,
				permissions: [PermissionCodeEnum.RUP_FULL, PermissionCodeEnum.KPI_FULL],
			},
		],
	},
]

export const navFooter = [
	{
		id: 'support',
		titleKey: 'support',
		url: '/support',
		icon: Headset,
	},
]
