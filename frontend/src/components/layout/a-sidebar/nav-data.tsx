import { BookOpen, CircleQuestionMark, Headset, LayoutDashboard, PenIcon, Table2Icon } from 'lucide-react'

export const navUser = {
	name: 'just-sain',
	role: 'Администратор',
	email: 'just-sain@apc.loc',
	avatar: 'https://avatars.githubusercontent.com/u/1486366',
}

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
		url: '/subjects/123',
		icon: BookOpen,
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
