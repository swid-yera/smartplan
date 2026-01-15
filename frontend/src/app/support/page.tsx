import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Badge, Heading, Separator } from '@ui'
import { CircleQuestionMark, MailIcon, PhoneIcon } from 'lucide-react'

const faqs = [
	{
		question: 'Как ИИ помогает в создании РУП?',
		answer:
			'ИИ анализирует введенные данные и автоматически генерирует структуру и содержание рабочей программы, предлагая формулировки компетенций и результатов обучения.',
	},
	{
		question: 'Можно ли редактировать созданные планы?',
		answer:
			'Да, все автоматически созданные планы полностью доступны для редактирования и корректировки преподавателем.',
	},
	{
		question: 'Как формируется рейтинг преподавателей?',
		answer:
			'Рейтинг рассчитывается на основе KPI, которые включают учебную, методическую, научную и воспитательную работу.',
	},
	{
		question: 'Безопасны ли мои данные?',
		answer:
			'Мы уделяем приоритетное внимание безопасности данных. Вся информация хранится в зашифрованном виде и доступна только авторизованным пользователям.',
	},
]

const Page = () => {
	return (
		<section className='w-full py-12 md:py-24 lg:py-32'>
			<div className='container max-w-6xl w-full mx-auto px-4 md:px-6 grid grid-cols-2 gap-12'>
				{/* contacts */}
				<div className='w-full'>
					<Badge variant='secondary'>
						<CircleQuestionMark />
						Часто задаваемые вопросы
					</Badge>
					<Heading align='left' className='mt-1 text-5xl leading-12' size='h1'>
						Всё что вам нужно
						<br /> знать
					</Heading>
					<p className='mt-4'>
						Получите ответы на самые распространенные вопросы о нашей платформе. Остались вопросы? Наша команда
						готова помочь.
					</p>

					<Separator className='mt-8' />

					<div className='mt-6 flex justify-start items-center gap-3'>
						<MailIcon className='h-6 w-6 text-muted-foreground' /> example@gmail.com
					</div>
					<div className='mt-6 flex justify-start items-center gap-3'>
						<PhoneIcon className='h-6 w-6 text-muted-foreground' /> +7 (777) 777 77 77
					</div>
				</div>

				{/* faq */}
				<Accordion collapsible className='w-full' defaultValue='item-0' type='single'>
					{faqs.map((faq, index) => (
						<AccordionItem key={index} value={`item-${index}`}>
							<AccordionTrigger className='text-base'>{faq.question}</AccordionTrigger>
							<AccordionContent className='text-muted-foreground italic'>{faq.answer}</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</section>
	)
}

export default Page
