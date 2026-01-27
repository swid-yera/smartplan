import {
	Award,
	BookCopy,
	BookOpen,
	Group,
	Headset,
	Kanban,
	LayoutDashboard,
	ListCheck,
	Megaphone,
	PenIcon,
	Users,
} from 'lucide-react'

export const navMain = [
	{
		title: 'Панель управления',
		url: '/dashboard',
		icon: LayoutDashboard,
	},
	{
		title: 'Рабочие Учебные Планы',
		url: '/rups',
		icon: PenIcon,
	},
	{
		title: 'Поурочный план',
		url: '/lessons',
		icon: BookOpen,
	},
	{
		title: 'KPI',
		url: '/kpi',
		icon: Award,
		items: [
			{
				icon: Kanban,
				title: 'Управление',
				url: '/kpi',
			},
			{
				icon: BookCopy,
				title: 'Подробнее',
				url: '/kpi/info',
			},
			{
				icon: Megaphone,
				title: 'Рейтинг преподавателей',
				url: '/kpi/rating',
			},
			{
				icon: ListCheck,
				title: 'Критерии оценивания',
				url: '/kpi/types',
			},
		],
	},
	{
		title: 'Пользователи',
		url: '/users',
		icon: Users,
	},
	{
		title: 'Группы',
		url: '/groups',
		icon: Group,
	},
]

export const navFooter = [
	{
		title: 'Поддержка',
		url: '/support',
		icon: Headset,
	},
]
