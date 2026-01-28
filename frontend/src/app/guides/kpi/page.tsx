'use client'

import type { FC, PropsWithChildren } from 'react'

import { Loader, PageTitle } from '@components'
import { normalizeCriteriaMethod } from '@helpers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from '@shadcn'
import { useAuthStore } from '@store'
import { CriteriaMethodEnum } from '@types'
import { CheckCircle, ClipboardList, type LucideIcon, TrendingUp, Users } from 'lucide-react'

const Page = () => {
	const { user, authLoading } = useAuthStore()

	if (!user || authLoading) return <Loader type='data' />

	return (
		<section className='mx-auto w-full max-w-6xl space-y-8 p-4'>
			<PageTitle sticky backHref='/kpi' description='KPI'>
				Подробнее о системе подсчёта KPI
			</PageTitle>

			{/* HERO / INFOGRAPHIC */}
			<div className='relative overflow-hidden rounded-xl border bg-muted'>
				<div className='p-6 sm:p-8'>
					<h2 className='text-xl font-semibold'>KPI — инструмент развития, а не контроля</h2>
					<p className='mt-2 max-w-2xl text-sm text-muted-foreground'>
						Система ключевых показателей эффективности помогает объективно оценивать вклад преподавателей и
						повышать качество образовательного процесса.
					</p>
				</div>
			</div>

			{/* KEY POINTS */}
			<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
				<InfoCard icon={ClipboardList} title='Прозрачность'>
					Единые и понятные критерии оценки
				</InfoCard>
				<InfoCard icon={TrendingUp} title='Эффективность'>
					Рост качества и результативности работы
				</InfoCard>
				<InfoCard icon={Users} title='Справедливость'>
					Сравнимая оценка деятельности сотрудников
				</InfoCard>
				<InfoCard icon={CheckCircle} title='Мотивация'>
					Моральное и материальное поощрение
				</InfoCard>
			</div>

			{/* MAIN CONTENT */}
			<Card>
				<CardHeader>
					<CardTitle>KPI преподавателей и подразделений</CardTitle>
					<CardDescription>Общая информация о целях и принципах системы KPI</CardDescription>
				</CardHeader>

				<CardContent className='space-y-4 text-sm leading-relaxed'>
					<p>
						KPI-оценка деятельности преподавательского состава колледжа и его подразделений проводится по итогам
						учебного года и охватывает учебную, методическую, научную и воспитательную деятельность.
					</p>

					<p>
						Основная цель внедрения KPI — повышение эффективности работы педагогического коллектива и качества
						подготовки специалистов.
					</p>

					<Separator />

					<div>
						<p className='mb-2 font-semibold'>Условия эффективности KPI-системы:</p>
						<ul className='space-y-2'>
							<li className='flex gap-2'>
								<CheckCircle className='mt-1 h-4 w-4 text-primary' />
								<span>Охват всех видов деятельности преподавателя</span>
							</li>
							<li className='flex gap-2'>
								<CheckCircle className='mt-1 h-4 w-4 text-primary' />
								<span>Объективность и измеряемость показателей</span>
							</li>
							<li className='flex gap-2'>
								<CheckCircle className='mt-1 h-4 w-4 text-primary' />
								<span>Понятность и достижимость критериев</span>
							</li>
							<li className='flex gap-2'>
								<CheckCircle className='mt-1 h-4 w-4 text-primary' />
								<span>Мотивация и вовлечённость сотрудников</span>
							</li>
						</ul>
					</div>
				</CardContent>
			</Card>

			{/* METHOD */}
			<Card>
				<CardHeader>
					<CardTitle>Методика расчёта и порядок проведения</CardTitle>
					<CardDescription>Как формируется итоговый KPI</CardDescription>
				</CardHeader>

				<CardContent className='space-y-4 text-sm'>
					<p>
						KPI преподавателя определяется как сумма баллов по всем критериям KPI-карты, утверждённой
						педагогическим советом.
					</p>

					<Separator />

					<ol className='space-y-4 border-l pl-4'>
						<li>
							<p className='font-semibold'>1. Утверждение критериев</p>
							<p className='text-muted-foreground'>Педагогический совет колледжа</p>
						</li>
						<li>
							<p className='font-semibold'>2. Сбор и проверка данных</p>
							<p className='text-muted-foreground'>Заполнение и анализ KPI-карт</p>
						</li>
						<li>
							<p className='font-semibold'>3. Подведение итогов</p>
							<p className='text-muted-foreground'>Работа KPI-комиссии</p>
						</li>
					</ol>
				</CardContent>
			</Card>

			{/* CALLOUT */}
			<div className='rounded-lg border-l-4 border-primary bg-muted p-4 italic'>
				«KPI — это инструмент роста и признания вклада каждого преподавателя, а не формальный контроль»
			</div>

			{/* types */}
			<Card>
				<CardHeader>
					<CardTitle>Критерии оценивания</CardTitle>
					<CardDescription>Роль критериев в системе KPI преподавателей и подразделений</CardDescription>
				</CardHeader>

				<CardContent className='space-y-3 text-sm leading-relaxed'>
					<p>
						Критерии оценивания – это ключевые параметры, по которым оценивается деятельность сотрудника. Они
						позволяют объективно определить качество работы преподавателей и подразделений.
					</p>

					<p>
						Каждый критерий имеет строго однозначную интерпретацию, раскрываемую в пояснениях и примерах. Критерии
						разрабатываются KPI-комиссией, утверждаются приказом директора и доводятся до сведения коллектива.
					</p>

					<Separator />

					<p className='font-semibold'>Основные свойства критериев:</p>
					<ul className='list-disc list-inside space-y-1 text-muted-foreground'>
						<li>Объективность и измеримость;</li>
						<li>Понятность и достижимость для преподавателей и руководителей;</li>
						<li>Возможность для морального и материального поощрения;</li>
						<li>Поддержка анализа эффективности работы и выявления областей для улучшения.</li>
					</ul>
				</CardContent>
			</Card>

			{/* types  */}
			<Card>
				<CardHeader>
					<CardTitle>Структура критериев</CardTitle>
					<CardDescription>Варианты критериев и способы начисления баллов</CardDescription>
				</CardHeader>

				<CardContent className='space-y-3 text-sm leading-relaxed'>
					<p>
						Каждый критерий может иметь несколько вариантов (Variants), которые отражают различные аспекты
						деятельности преподавателя или подразделения.
					</p>

					<p>Варианты состоят из набора критериев, для которых устанавливаются баллы:</p>

					<ul className='list-disc list-inside space-y-1 text-muted-foreground'>
						<li>
							<strong>Римская нумерация</strong> используется для удобного отображения подсписков критериев.
						</li>
						<li>
							<em>Points</em> могут быть двух типов:
							<ul className='list-inside list-decimal space-y-1 text-muted-foreground ml-4'>
								<li>
									<strong>NORMAL - {normalizeCriteriaMethod(CriteriaMethodEnum.NORMAL)}</strong>: фиксированное
									количество баллов [x]
								</li>
								<li>
									<strong>MEASURING - {normalizeCriteriaMethod(CriteriaMethodEnum.MEASURING)}</strong>:
									диапазон баллов [min, max]
								</li>
							</ul>
						</li>
						<li>Описание и пояснения к каждому варианту помогают понять, что именно оценивается.</li>
					</ul>

					<p>
						Такая структура позволяет KPI-системе быть гибкой, объективной и прозрачной, обеспечивая точную оценку
						результатов работы преподавателей и подразделений.
					</p>
				</CardContent>
			</Card>
		</section>
	)
}

export default Page

interface IInfoCard {
	icon: LucideIcon
	title: string
	children: string
}

const InfoCard: FC<PropsWithChildren<IInfoCard>> = ({ icon: Icon, title, children }) => {
	return (
		<Card>
			<CardContent>
				<Icon className='mb-2 h-8 w-8 text-primary' />
				<h4 className='font-semibold'>{title}</h4>
				<p className='text-sm text-muted-foreground'>{children}</p>
			</CardContent>
		</Card>
	)
}
