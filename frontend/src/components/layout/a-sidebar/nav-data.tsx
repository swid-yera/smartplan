import { RoleEnum } from '@types'
import {
	Award,
	BookCopy,
	BookOpen,
	BookType,
	ChartBar,
	ClipboardClock,
	FileBadge,
	FilePlus,
	Film,
	Group,
	Headset,
	LayoutDashboard,
	LibraryBig,
	ListCheck,
	type LucideIcon,
	Medal,
	MessageCircleQuestionMark,
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
				url: '/rups/tutorial',
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
		title: 'Поурочный план',
		url: '/lessons',
		icon: BookOpen,
		role: RoleEnum.TEACHER,
		items: [
			{
				icon: Notebook,
				title: 'Мои поурочные планы',
				url: '/lessons/my',
				role: RoleEnum.TEACHER,
			},
			{
				icon: NotebookPen,
				title: 'Создать поурочный план',
				url: '/lessons/create',
				role: RoleEnum.TEACHER,
			},
			{
				icon: MessageCircleQuestionMark,
				title: 'Как работает генерация?',
				url: '/guides/lessons',
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
				title: 'Мои достижения',
				url: '/kpi/my',
				role: RoleEnum.TEACHER,
			},
			{
				icon: FileBadge,
				title: 'Опубликовать награду',
				url: '/kpi/create',
				role: RoleEnum.TEACHER,
			},
			// methodist
			{
				icon: Ribbon,
				title: 'Все награды',
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
			// help
			{
				icon: MessageCircleQuestionMark,
				title: 'Что такое KPI?',
				url: '/guides/kpi',
				role: RoleEnum.TEACHER,
			},
		],
	},
	{
		title: 'Группы',
		url: '/groups',
		icon: Group,
	},
	{
		title: 'Материал для обучения',
		url: '/guides',
		icon: BookType,
	},
	{
		icon: ShieldUser,
		title: 'Администрирование',
		url: '/admin',
		defaultOpen: true,
		role: RoleEnum.ADMIN,
		items: [
			{
				title: 'Настройки',
				url: '/settings',
				icon: Group,
			},
			{
				title: 'Пользователи',
				url: '/users',
				icon: Users,
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
