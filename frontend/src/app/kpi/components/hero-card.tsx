import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui'
import { BarChart3, BookOpen, Clock, GraduationCap, MessageSquare } from 'lucide-react'

export const HeroCard = () => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<BarChart3 className='h-5 w-5 text-primary' />
					Рейтинг преподавателей
				</CardTitle>

				<CardDescription>Оценка эффективности преподавателей на основе KPI</CardDescription>
			</CardHeader>

			<CardContent className='space-y-4 text-sm'>
				<p className='text-muted-foreground'>
					Рейтинг формируется на основе <strong>KPI — ключевых показателей эффективности</strong>, отражающих
					качество обучения и вклад преподавателя в образовательный процесс.
				</p>

				<ul className='space-y-3'>
					<li className='flex gap-3'>
						<GraduationCap className='h-4 w-4 text-muted-foreground mt-0.5' />
						<span>
							<strong>Учебные результаты студентов:</strong> успеваемость, динамика прогресса, экзамены и
							аттестации.
						</span>
					</li>

					<li className='flex gap-3'>
						<MessageSquare className='h-4 w-4 text-muted-foreground mt-0.5' />
						<span>
							<strong>Обратная связь от студентов:</strong> оценки и отзывы о качестве преподавания и
							вовлеченности.
						</span>
					</li>

					<li className='flex gap-3'>
						<BookOpen className='h-4 w-4 text-muted-foreground mt-0.5' />
						<span>
							<strong>Методическая активность:</strong> учебные материалы, проекты, публикации и повышение
							квалификации.
						</span>
					</li>

					<li className='flex gap-3'>
						<Clock className='h-4 w-4 text-muted-foreground mt-0.5' />
						<span>
							<strong>Дисциплина и ответственность:</strong> соблюдение расписания, своевременная проверка работ.
						</span>
					</li>
				</ul>

				<p className='text-muted-foreground'>
					Все показатели имеют вес, а итоговый рейтинг рассчитывается автоматически и регулярно обновляется,
					обеспечивая прозрачность и объективность.
				</p>
			</CardContent>
		</Card>
	)
}
