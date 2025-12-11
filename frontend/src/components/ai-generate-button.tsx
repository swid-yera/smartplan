'use client'

import { type FC, useState } from 'react'

import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui'
import { BrainCog } from 'lucide-react'

import { Textarea } from './ui/textarea'

// /components/ai/ai-generate-button.tsx

type GenType = 'annotation' | 'goals' | 'results'

interface AiGenerateButtonProps {
	defaultType?: GenType
	onGenerated?: (text: string) => void
	generateEndpoint?: string // optional: POST endpoint which accepts { type, prompt } and returns { text }
}

// ai generate, shows like button, when clicked open module window where configure generate system
export const AiGenerateButton: FC<AiGenerateButtonProps> = ({
	defaultType = 'annotation',
	onGenerated,
	generateEndpoint,
}) => {
	const [open, setOpen] = useState(false)
	const [type, setType] = useState<GenType>(defaultType)
	const [prompt, setPrompt] = useState('')
	const [result, setResult] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function handleGenerate() {
		setError(null)
		setLoading(true)

		try {
			if (generateEndpoint) {
				const res = await fetch(generateEndpoint, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ type, prompt }),
				})

				if (!res.ok) throw new Error(`Server returned ${res.status}`)
				const data = await res.json()

				// await { text: string }
				setResult(typeof data === 'string' ? data : (data.text ?? ''))
			} else {
				// demo text
				const demo = generateDemoText(type, prompt)

				// some timeout
				await new Promise((r) => setTimeout(r, 600))
				setResult(demo)
			}
		} catch (e) {
			console.error(e)
			setError('Ошибка генерации')
		} finally {
			setLoading(false)
		}
	}

	function handleInsert() {
		if (!result) return
		onGenerated?.(result)
		// reset
		setOpen(false)
		setPrompt('')
		setResult('')
		setType(defaultType)
		setError(null)
	}

	return (
		<>
			{/* button */}
			<Button type='button' variant='secondary' onClick={() => setOpen(true)}>
				<BrainCog />
				<span>Сгенерировать с ИИ</span>
			</Button>

			{/* modal */}
			{open && (
				<div className='fixed inset-0 z-50 flex items-start justify-center px-4 py-8'>
					{/* overlay */}
					<div aria-hidden className='absolute inset-0 bg-black/40' onClick={() => setOpen(false)} />

					{/* dialog */}
					<div className='relative z-10 w-full max-w-lg bg-white rounded-lg shadow-lg border p-5'>
						<div className='flex items-end justify-between mb-4'>
							<h3 className='text-md font-semibold'>ИИ-генерация текста</h3>
							<Button type='button' variant='outline' onClick={() => setOpen(false)}>
								Закрыть
							</Button>
						</div>

						<div className='space-y-3'>
							<div className='space-y-2'>
								<Label htmlFor='ai-generate-prompt'>Тема / раздел / что нужно описать</Label>
								<Input
									placeholder='Например: Цели и задачи дисциплины «Информационные системы»'
									value={prompt}
									onChange={(e) => setPrompt(e.target.value)}
								/>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='ai-generate-type'>Тип текста</Label>
								<Select value={type} onValueChange={(v) => setType(v as GenType)}>
									<SelectTrigger className='w-full'>
										<SelectValue placeholder='Выбрать тип...' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='annotation'>Аннотация</SelectItem>
										<SelectItem value='goals'>Цели и задачи</SelectItem>
										<SelectItem value='results'>Планируемые результаты</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className='space-y-2'>
								<label className='block text-xs font-medium text-slate-600 mb-1'>Результат</label>
								<Textarea
									className='w-full rounded-lg border px-3 py-2 text-sm'
									placeholder='Сгенерированный текст отобразится здесь. Вы можете отредактировать его перед вставкой.'
									rows={6}
									value={result}
									onChange={(e) => setResult(e.target.value)}
								/>
								<p className='text-xs text-slate-400 mt-2'>
									Текст сгенерирован ИИ и требует проверки преподавателем.
								</p>
								{error && <p className='text-xs text-red-500 mt-2'>Ошибка: {error}</p>}
							</div>

							<div className='flex items-center justify-between pt-3'>
								<div>
									<Button
										disabled={loading}
										type='button'
										variant='outline'
										onClick={() => {
											setOpen(false)
										}}
									>
										Отмена
									</Button>
								</div>

								<div className='flex items-center gap-2'>
									<Button disabled={loading} type='button' variant='secondary' onClick={handleGenerate}>
										{loading ? 'Генерация...' : 'Сгенерировать'}
									</Button>

									<Button disabled={!result} type='button' variant='default' onClick={handleInsert}>
										Вставить в поле
									</Button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

/** Simple demo generator — replace with real call if needed */
function generateDemoText(type: GenType, prompt: string) {
	const header = prompt ? `${prompt}. ` : ''

	if (type === 'annotation') {
		return (
			header +
			'Аннотация: Краткое описание дисциплины, её целей и задач, указывающее на значение предмета в подготовке специалиста. Дисциплина формирует базовые практические навыки и теоретические знания, необходимые для работы с информационными системами.'
		)
	}
	if (type === 'goals') {
		return (
			header +
			'Цели и задачи: Формирование у студентов знаний о структуре информационных систем, навыков проектирования и администрирования; развитие умений анализа требований, разработки простых приложений и их тестирования.'
		)
	}

	// results
	return (
		header +
		'Планируемые результаты: Студент должен уметь описывать архитектуру информационных систем, применять методы проектирования, разрабатывать простые модули ПО и проводить их тестирование, пользоваться инструментами управления базами данных.'
	)
}
