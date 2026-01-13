import { Award, BookOpen, Headset, LayoutDashboard, PenIcon, Table2Icon, University } from 'lucide-react'

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
		title: 'Уроки',
		url: '/subjects',
		icon: BookOpen,
	},
	{
		title: 'KPI',
		url: '/kpi',
		icon: Award,
	},
	{
		title: 'Расписание',
		url: '/timetable',
		icon: Table2Icon,
	},
	{
		title: 'Преподаватели',
		url: '/teachers',
		icon: University,
	},
]

export const navFooter = [
	{
		title: 'Поддержка',
		url: '/support',
		icon: Headset,
	},
]
