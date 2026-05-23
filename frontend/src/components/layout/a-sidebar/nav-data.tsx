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
	NotebookPen,
	PenIcon,
	Ribbon,
	ShieldUser,
	Users,
} from 'lucide-react'

export interface INav {
	title: string
	url: string
	icon: LucideIcon
	defaultOpen?: boolean
	role?: RoleEnum
	items?: {
		icon: LucideIcon
		title: string
		url: string
		role?: RoleEnum
	}[]
}

export const navMain: INav[] = [
	{
		title: 'Панель управления',
		url: '/dashboard',
		icon: LayoutDashboard,
	},
	{
		title: 'Рабочие учебные программы',
		url: '/rups',
		icon: PenIcon,
		items: [
			// teacher
			{
				icon: LibraryBig,
				title: 'Мои РУП',
				url: '/rups/my',
				role: RoleEnum.TEACHER,
			},
			{
				icon: FilePlus,
				title: 'Создать РУП',
				url: '/rups/create',
				role: RoleEnum.TEACHER,
			},
			{
				icon: Film,
				title: 'Обучение',
				url: '/guides/rups',
				role: RoleEnum.TEACHER,
			},
			// methodist
			{
				icon: BookCopy,
				title: 'Все РУП',
				url: '/rups/all',
				role: RoleEnum.METHODIST,
			},
			{
				icon: ClipboardClock,
				title: 'Ожидают проверки',
				url: '/rups/review',
				role: RoleEnum.METHODIST,
			},
		],
	},
	{
		title: 'План учебного занятия',
		url: '/lessons',
		icon: BookOpen,
		role: RoleEnum.TEACHER,
		items: [
			{
				icon: Notebook,
				title: 'Мои планы учебных занятий',
				url: '/lessons/my',
				role: RoleEnum.TEACHER,
			},
			{
				icon: NotebookPen,
				title: 'Создать план учебного занятия',
				url: '/lessons/create',
				role: RoleEnum.TEACHER,
			},
		],
	},
	{
		title: 'KPI',
		url: '/kpi',
		icon: Award,
		items: [
			// teacher
			{
				icon: Medal,
				title: 'Мои данные',
				url: '/kpi/my',
				role: RoleEnum.TEACHER,
			},
			// methodist
			{
				icon: Ribbon,
				title: 'Все данные',
				url: '/kpi/all',
				role: RoleEnum.METHODIST,
			},
			{
				icon: ClipboardClock,
				title: 'Ожидают проверки',
				url: '/kpi/review',
				role: RoleEnum.METHODIST,
			},
			{
				icon: ChartBar,
				title: 'Рейтинг преподавателей',
				url: '/kpi/rating',
			},
			{
				icon: ListCheck,
				title: 'Критерии оценивания KPI',
				url: '/kpi/types',
				role: RoleEnum.METHODIST,
			},
		],
	},
	{
		title: 'Группы',
		url: '/groups',
		icon: Group,
	},
	{
		icon: ShieldUser,
		title: 'Администрирование',
		url: '/admin',
		defaultOpen: true,
		role: RoleEnum.ADMIN,
		items: [
			{
				title: 'Пользователи',
				url: '/users',
				icon: Users,
			},
			{
				title: 'Настройки',
				url: '/settings',
				icon: Group,
			},
			{
				title: 'Категорий KPI',
				url: '/kpi/categories',
				icon: ListCheck,
			},
			{
				title: 'Критерий оценивание KPI',
				url: '/kpi/types',
				icon: ListCheck,
			},
			{
				title: 'HikCentral',
				url: '/settings/hik',
				icon: Cctv,
			},
		],
	},
]

export const navFooter = [
	{
		title: 'Поддержка',
		url: '/support',
		icon: Headset,
	},
]
