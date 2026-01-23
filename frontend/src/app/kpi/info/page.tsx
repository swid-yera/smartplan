'use client'

import { Loader, PageTitle } from '@components'
import { useAuthStore } from '@store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from '@ui'

const Page = () => {
	const { user, authLoading } = useAuthStore()

	if (!user || authLoading) return <Loader type='data' />

	return (
		<section className='p-4 w-full space-y-4'>
			<PageTitle sticky backHref='/kpi' description='KPI'>
				Подробнее о системе подсчетов KPI
			</PageTitle>

			{/* content */}
			<Card>
				<CardHeader>
					<CardTitle>KPI преподавателей и подразделений</CardTitle>
					<CardDescription>
						Общая информация о KPI и его значении для стратегического управления колледжем
					</CardDescription>
				</CardHeader>

				<CardContent className='space-y-3 text-sm leading-relaxed'>
					<p>
						KPI-оценка деятельности преподавательского состава колледжа и его основных подразделений по итогам
						года является важной составляющей стратегического управления. Она позволяет сравнивать результаты
						деятельности преподавателей и мастеров по показателям, характеризующим научную, учебную, методическую
						и воспитательную работу.
					</p>

					<p>
						Конечной целью системы KPI является повышение эффективности работы и конкурентоспособности
						научно-педагогического коллектива колледжа и, как следствие, улучшение качества подготовки
						специалистов.
					</p>

					<Separator />

					<p className='font-semibold'>Условия эффективности KPI-системы:</p>
					<ul className='list-disc list-inside space-y-1 text-muted-foreground'>
						<li>Охват всех видов деятельности преподавателя;</li>
						<li>Обеспечение эффективного выполнения преподавателями своих должностных обязанностей;</li>
						<li>Объективность оценки работы;</li>
						<li>Гибкость системы, позволяющая изменять приоритеты и критерии;</li>
						<li>Соответствие стандартам среднего профессионального образования;</li>
						<li>Понятность и достижимость критериев для сотрудников;</li>
						<li>Моральное и материальное поощрение работников;</li>
						<li>Повышение мотивации и личной заинтересованности преподавателей;</li>
						<li>Определение областей для улучшения и корректирующие мероприятия.</li>
					</ul>
				</CardContent>
			</Card>

			{/* Карточка 2: Методика расчёта и порядок проведения */}
			<Card>
				<CardHeader>
					<CardTitle>Методика расчёта и порядок проведения KPI</CardTitle>
					<CardDescription>Информация о том, как проводится KPI-оценка, цели и задачи системы</CardDescription>
				</CardHeader>

				<CardContent className='space-y-3 text-sm leading-relaxed'>
					<p className='font-semibold'>Цели KPI:</p>
					<ul className='list-disc list-inside space-y-1 text-muted-foreground'>
						<li>
							Активизация и стимулирование профессиональной и общественно значимой деятельности преподавателей;
						</li>
						<li>Повышение качества образовательных услуг колледжа;</li>
					</ul>

					<p className='font-semibold'>Задачи KPI:</p>
					<ul className='list-disc list-inside space-y-1 text-muted-foreground'>
						<li>Создание системы внутреннего аудита эффективности преподавателей и подразделений;</li>
						<li>Создание информационной базы данных по деятельности сотрудников;</li>
						<li>Моральное и материальное стимулирование повышения квалификации и продуктивности работы;</li>
						<li>Анализ результатов KPI для оперативного управления подразделениями.</li>
					</ul>

					<Separator />

					<p className='font-semibold'>Методика расчёта:</p>
					<p>
						KPI преподавателя и мастера производственного обучения определяется как сумма баллов по результатам
						заполнения KPI-карты.
					</p>

					<p className='font-semibold'>Порядок подведения итогов:</p>
					<ul className='list-disc list-inside space-y-1 text-muted-foreground'>
						<li>Ежегодное утверждение критериев KPI на педагогическом совете;</li>
						<li>Использование оптимального числа объективных и измеряемых критериев;</li>
						<li>
							Создание компьютерной базы данных и использование локальной сети колледжа для публикации
							результатов;
						</li>
						<li>Организация KPI-комиссии для подведения итогов;</li>
						<li>Учет квалификационного уровня и активности преподавателей;</li>
						<li>Конфиденциальность результатов KPI для сотрудников.</li>
					</ul>
				</CardContent>
			</Card>
		</section>
	)
}

export default Page
