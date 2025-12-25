import { Award, BookOpen, CircleQuestionMark, Headset, LayoutDashboard, PenIcon, Table2Icon } from 'lucide-react'

export const navMain = [
	{
		title: 'Панель управления',
		url: '/dashboard',
		icon: LayoutDashboard,
		isActive: true,
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
		title: 'Награды',
		url: '/awards',
		icon: Award,
	},
	{
		title: 'Расписание',
		url: '/timetable/cs-2025-a',
		icon: Table2Icon,
	},
]

export const navFooter = [
	{
		title: 'FAQ',
		url: '/faq',
		icon: CircleQuestionMark,
	},
	{
		title: 'связь с поддержкой',
		url: '/support',
		icon: Headset,
	},
]
