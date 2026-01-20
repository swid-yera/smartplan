import { Award, BookOpen, Headset, LayoutDashboard, PenIcon, Users } from 'lucide-react'

export const navMain = [
	{
		title: 'Панель управления',
		url: '/dashboard',
		icon: LayoutDashboard,
	},
	{
		title: 'Модули РУП',
		url: '/rups',
		icon: PenIcon,
	},
	{
		title: 'Поурочный план',
		url: '/subjects',
		icon: BookOpen,
	},
	{
		title: 'KPI',
		url: '/kpi',
		icon: Award,
	},
	{
		title: 'Пользователи',
		url: '/users',
		icon: Users,
	},
]

export const navFooter = [
	{
		title: 'Поддержка',
		url: '/support',
		icon: Headset,
	},
]
