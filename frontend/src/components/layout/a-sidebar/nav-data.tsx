import {
	BookOpen,
	CircleQuestionMark,
	ExpandIcon,
	Headset,
	Import,
	LayoutDashboard,
	PanelBottomOpenIcon,
	PenIcon,
	Table2Icon,
} from 'lucide-react'

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
		title: 'РУП',
		url: '/rup/123',
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
	{
		title: 'Импорт',
		url: '/ai/import',
		icon: Import,
	},
	{
		title: 'Экспорт',
		url: '/exports',
		icon: ExpandIcon,
	},
	{
		title: 'Панель администратора',
		url: '/admin',
		icon: PanelBottomOpenIcon,
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
