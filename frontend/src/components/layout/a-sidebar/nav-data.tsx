import { RoleEnum } from '@types'
import {
	Award,
	BookCopy,
	BookOpen,
	Cctv,
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
	role?: RoleEnum
	items?: {
		id: string
		icon: LucideIcon
		titleKey: string
		url: string
		role?: RoleEnum
	}[]
}

export const navMain: INav[] = [
	{
		id: 'dashboard',
		titleKey: 'dashboard',
		url: '/dashboard',
		icon: LayoutDashboard,
	},
	{
		id: 'rups',
		titleKey: 'rups',
		url: '/rups',
		icon: PenIcon,
		items: [
			// teacher
			{
				id: 'rups-my',
				icon: LibraryBig,
				titleKey: 'rupsMy',
				url: '/rups/my',
				// role: RoleEnum.TEACHER,
			},
			{
				id: 'rups-create',
				icon: FilePlus,
				titleKey: 'rupsCreate',
				url: '/rups/create',
				// role: RoleEnum.TEACHER,
			},
			{
				id: 'rups-guides',
				icon: Film,
				titleKey: 'rupsGuides',
				url: '/rups/guides',
				// role: RoleEnum.TEACHER,
			},
			// methodist
			{
				id: 'rups-all',
				icon: BookCopy,
				titleKey: 'rupsAll',
				url: '/rups/all',
				role: RoleEnum.METHODIST,
			},
			{
				id: 'rups-review',
				icon: ClipboardClock,
				titleKey: 'rupsReview',
				url: '/rups/review',
				role: RoleEnum.METHODIST,
			},
		],
	},
	{
		id: 'lessons',
		titleKey: 'lessons',
		url: '/lessons',
		icon: BookOpen,
		role: RoleEnum.TEACHER,
		items: [
			{
				id: 'lessons-my',
				icon: Notebook,
				titleKey: 'lessonsMy',
				url: '/lessons/my',
				role: RoleEnum.TEACHER,
			},
		],
	},
	{
		id: 'kpi',
		titleKey: 'kpi',
		url: '/kpi',
		icon: Award,
		items: [
			// teacher
			{
				id: 'kpi-my',
				icon: Medal,
				titleKey: 'kpiMy',
				url: '/kpi/my',
				role: RoleEnum.TEACHER,
			},
			{
				id: 'kpi-entry',
				icon: FilePlus,
				titleKey: 'kpiEntry',
				url: '/kpi/entry',
				role: RoleEnum.TEACHER,
			},
			// methodist
			{
				id: 'kpi-all',
				icon: Ribbon,
				titleKey: 'kpiAll',
				url: '/kpi/all',
				role: RoleEnum.METHODIST,
			},
			{
				id: 'kpi-rating',
				icon: ChartBar,
				titleKey: 'kpiRating',
				url: '/kpi/rating',
				role: RoleEnum.METHODIST,
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
		defaultOpen: true,
		role: RoleEnum.ADMIN,
		items: [
			{
				id: 'users',
				titleKey: 'users',
				url: '/users',
				icon: Users,
			},
			{
				id: 'settings',
				titleKey: 'settings',
				url: '/settings',
				icon: Group,
			},
			{
				id: 'kpi-categories',
				titleKey: 'kpiCategories',
				url: '/kpi/categories',
				icon: ListCheck,
			},
			{
				id: 'kpi-criteria',
				titleKey: 'kpiCriteria',
				url: '/kpi/types',
				icon: ListCheck,
			},
			{
				id: 'hik',
				titleKey: 'hik',
				url: '/settings/hik',
				icon: Cctv,
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
