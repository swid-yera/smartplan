'use client'

import { useState } from 'react'

import type { IExportFilters, IExportJob } from '@types'
import { mockExportJobs } from '@types'
import { Button, Card, CardHeader, CardTitle } from '@ui'

import { ExportFilters } from './export-filters'
import { ExportsTable } from './exports-table'

const Page = () => {
	const [exportJobs, setExportJobs] = useState<IExportJob[]>(mockExportJobs)
	const [filters, setFilters] = useState<IExportFilters>({})
	const [isGenerating, setIsGenerating] = useState(false)

	// Filter export jobs
	const filteredJobs = exportJobs.filter((job) => {
		if (filters.programName && !job.programName.toLowerCase().includes(filters.programName.toLowerCase()))
			return false
		if (filters.rupName && !job.rupName.toLowerCase().includes(filters.rupName.toLowerCase())) return false
		if (filters.academicYear && job.academicYear !== filters.academicYear) return false
		if (filters.exportType && job.exportType !== filters.exportType) return false
		if (filters.status && job.status !== filters.status) return false

		return true
	})

	const handleGenerateExport = () => {
		setIsGenerating(true)

		// Simulate export generation
		const newJob: IExportJob = {
			id: `exp-${Date.now()}`,
			rupId: '1',
			rupName: 'РУП Информатика 2025-2026',
			programName: 'Информатика и вычислительная техника',
			academicYear: '2025-2026',
			exportType: 'pdf',
			status: 'pending',
			createdAt: new Date().toISOString(),
		}

		setExportJobs((prev) => [newJob, ...prev])

		// Simulate progress
		setTimeout(() => {
			setExportJobs((prev) =>
				prev.map((job) => (job.id === newJob.id ? { ...job, status: 'processing' as const } : job)),
			)
		}, 1000)

		setTimeout(() => {
			setExportJobs((prev) =>
				prev.map((job) =>
					job.id === newJob.id
						? {
								...job,
								status: 'completed' as const,
								completedAt: new Date().toISOString(),
								fileSize: 1024000,
								downloadUrl: `/downloads/${job.id}.pdf`,
							}
						: job,
				),
			)
			setIsGenerating(false)
		}, 5000)
	}

	const handleDownload = (job: IExportJob) => {
		if (job.downloadUrl) {
			// Simulate download
			alert(`Скачивание файла: ${job.rupName}.${job.exportType}`)
		}
	}

	// const formatFileSize = (bytes?: number) => {
	// 	if (!bytes) return '-'
	// 	const mb = bytes / (1024 * 1024)

	// 	return `${mb.toFixed(1)} MB`
	// }

	// const formatDate = (dateString: string) => {
	// 	return new Date(dateString).toLocaleString('ru-RU')
	// }

	return (
		<div className='container mx-auto p-6 max-w-7xl'>
			<Card className='mb-6'>
				<CardHeader>
					<CardTitle className='text-2xl'>Экспорты и отчеты</CardTitle>
				</CardHeader>
			</Card>

			<div className='space-y-6'>
				<ExportFilters filters={filters} onFiltersChange={setFilters} />

				{/* Generate New Export */}
				<div className='flex justify-between items-center'>
					<h2 className='text-xl font-semibold'>Список экспортов</h2>
					<Button disabled={isGenerating} onClick={handleGenerateExport}>
						{isGenerating ? 'Генерация...' : 'Создать новый экспорт'}
					</Button>
				</div>

				<ExportsTable exportJobs={filteredJobs} onDownload={handleDownload} />

				{filteredJobs.length === 0 && (
					<Card>
						<div className='p-8 text-center text-gray-500'>
							Экспорты не найдены. Попробуйте изменить фильтры или создать новый экспорт.
						</div>
					</Card>
				)}
			</div>
		</div>
	)
}

export default Page
