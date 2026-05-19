import type { LucideIcon } from 'lucide-react'
import {
	Award,
	BookOpen,
	BookText,
	Brain,
	BriefcaseBusiness,
	ClipboardCheck,
	FileText,
	FolderKanban,
	GraduationCap,
	Handshake,
	LibraryBig,
	Medal,
	Megaphone,
	Mic,
	NotebookPen,
	NotebookText,
	Presentation,
	Projector,
	Speech,
	Star,
	Trophy,
	UserRoundCheck,
	Users,
	UsersRound,
} from 'lucide-react'

export interface ICategoryIconOption {
	name: string
	label: string
	Icon: LucideIcon
	aliases?: string[]
}

export const CATEGORY_ICON_OPTIONS: ICategoryIconOption[] = [
	{ name: 'award', label: 'Награда', Icon: Award },
	{
		name: 'brain',
		label: 'Качество знаний',
		Icon: Brain,
		aliases: ['knowledge-quality', 'качество-знаний', 'качество знаний'],
	},
	{ name: 'book', label: 'Книга', Icon: BookOpen, aliases: ['book-open'] },
	{
		name: 'book-text',
		label: 'Публикации',
		Icon: BookText,
		aliases: ['publication', 'публикации', 'публикаций'],
	},
	{ name: 'briefcase', label: 'Портфель', Icon: BriefcaseBusiness, aliases: ['briefcase-business'] },
	{ name: 'clipboard-check', label: 'Проверка', Icon: ClipboardCheck, aliases: ['checklist'] },
	{ name: 'file-text', label: 'Документ', Icon: FileText, aliases: ['file', 'document'] },
	{
		name: 'folder-kanban',
		label: 'Проекты',
		Icon: FolderKanban,
		aliases: ['project', 'projects', 'группа', 'группы', 'проект', 'проекты'],
	},
	{ name: 'graduation-cap', label: 'Образование', Icon: GraduationCap, aliases: ['cap', 'education'] },
	{
		name: 'handshake',
		label: 'Кураторство',
		Icon: Handshake,
		aliases: ['curatorship', 'кураторство', 'руководство', 'классное-руководство'],
	},
	{
		name: 'library-big',
		label: 'Учебно-методические материалы',
		Icon: LibraryBig,
		aliases: ['methodical', 'materials', 'методические', 'учебно-методические'],
	},
	{ name: 'medal', label: 'Медаль', Icon: Medal },
	{
		name: 'megaphone',
		label: 'Трансляция практики',
		Icon: Megaphone,
		aliases: ['broadcast', 'practice', 'трансляция', 'практика'],
	},
	{
		name: 'mic',
		label: 'Выступления',
		Icon: Mic,
		aliases: ['speech', 'speaking', 'выступления', 'доклад'],
	},
	{ name: 'notebook', label: 'Заметки', Icon: NotebookPen, aliases: ['notebook-pen'] },
	{
		name: 'notebook-text',
		label: 'Методические записи',
		Icon: NotebookText,
		aliases: ['notes', 'materials-notes', 'методичка'],
	},
	{
		name: 'presentation',
		label: 'Презентация',
		Icon: Presentation,
		aliases: ['slides', 'выступление', 'презентация'],
	},
	{
		name: 'projector',
		label: 'Демонстрация',
		Icon: Projector,
		aliases: ['demonstration', 'трансляция-практики'],
	},
	{
		name: 'speech',
		label: 'Ораторство',
		Icon: Speech,
		aliases: ['talk', 'public-speaking'],
	},
	{ name: 'star', label: 'Звезда', Icon: Star },
	{ name: 'trophy', label: 'Кубок', Icon: Trophy },
	{
		name: 'trophy-competitions',
		label: 'Конкурсы и соревнования',
		Icon: Trophy,
		aliases: ['competition', 'contest', 'соревнования', 'конкурсы'],
	},
	{ name: 'users', label: 'Пользователи', Icon: Users, aliases: ['group', 'people'] },
	{
		name: 'users-round',
		label: 'Участие в группах',
		Icon: UsersRound,
		aliases: ['team', 'groups', 'участия-в-группах'],
	},
	{
		name: 'user-round-check',
		label: 'Классное руководство',
		Icon: UserRoundCheck,
		aliases: ['class-lead', 'mentor', 'классное-руководство', 'куратор'],
	},
]

const normalizeIconName = (value: string) =>
	value
		.trim()
		.toLowerCase()
		.replace(/[\s_]+/g, '-')

export const getCategoryIconOptionByName = (iconName?: string | null): ICategoryIconOption | null => {
	if (!iconName) return null

	const normalizedIconName = normalizeIconName(iconName)

	const exactMatch = CATEGORY_ICON_OPTIONS.find((option) => {
		const candidates = [option.name, ...(option.aliases || [])].map(normalizeIconName)

		return candidates.includes(normalizedIconName)
	})

	if (exactMatch) return exactMatch

	return (
		CATEGORY_ICON_OPTIONS.find((option) => {
			const candidates = [option.name, ...(option.aliases || [])].map(normalizeIconName)

			return candidates.some(
				(candidate) => candidate.includes(normalizedIconName) || normalizedIconName.includes(candidate),
			)
		}) || null
	)
}
