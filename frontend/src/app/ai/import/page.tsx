'use client'

import { useState } from 'react'

import type { IAIImportSession, IAIParsingResult } from '@types'
import { mockAIParsingResults } from '@types'
import { Button, Card, CardHeader, CardTitle } from '@ui'

import { FileUpload } from './file-upload'
import { ParsingProgress } from './parsing-progress'
import { PreviewTable } from './preview-table'

const Page = () => {
	const [importSession, setImportSession] = useState<IAIImportSession | null>(null)
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [programName, setProgramName] = useState('')
	const [academicYear, setAcademicYear] = useState('')
	const [isUploading, setIsUploading] = useState(false)
	const [parsedData, setParsedData] = useState<IAIParsingResult[]>([])

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]

		if (file) {
			setSelectedFile(file)
		}
	}

	const handleUpload = async () => {
		if (!selectedFile || !programName || !academicYear) {
			alert('Пожалуйста, заполните все поля')

			return
		}

		setIsUploading(true)

		// Simulate upload and parsing
		const session: IAIImportSession = {
			id: Date.now().toString(),
			fileName: selectedFile.name,
			fileType: selectedFile.name.endsWith('.pdf') ? 'pdf' : 'docx',
			uploadDate: new Date().toISOString(),
			status: 'uploading',
			progress: 0,
			programName,
			academicYear,
			parsedData: [],
		}

		setImportSession(session)

		// Simulate progress
		const progressInterval = setInterval(() => {
			setImportSession((prev) => {
				if (!prev) return prev
				const newProgress = Math.min(prev.progress + 10, 100)
				const newStatus: IAIImportSession['status'] = newProgress === 100 ? 'completed' : 'parsing'

				if (newProgress === 100) {
					clearInterval(progressInterval)
					setParsedData(mockAIParsingResults)
					setIsUploading(false)
				}

				return {
					...prev,
					progress: newProgress,
					status: newStatus,
					parsedData: newProgress === 100 ? mockAIParsingResults : [],
				}
			})
		}, 500)
	}

	const updateParsedData = (id: string, field: keyof IAIParsingResult, value: string | number) => {
		setParsedData((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
	}

	const handleSaveToRUP = () => {
		alert('Данные сохранены в РУП!')
		// Reset form
		setImportSession(null)
		setSelectedFile(null)
		setProgramName('')
		setAcademicYear('')
		setParsedData([])
	}

	return (
		<div className='container mx-auto p-6 max-w-6xl'>
			<Card className='mb-6'>
				<CardHeader>
					<CardTitle className='text-2xl'>ИИ Импорт РУП</CardTitle>
				</CardHeader>
			</Card>

			<div className='space-y-6'>
				<FileUpload
					academicYear={academicYear}
					isUploading={isUploading}
					programName={programName}
					selectedFile={selectedFile}
					onAcademicYearChange={setAcademicYear}
					onFileSelect={handleFileSelect}
					onProgramNameChange={setProgramName}
					onUpload={handleUpload}
				/>

				{importSession && <ParsingProgress importSession={importSession} />}

				{parsedData.length > 0 && <PreviewTable parsedData={parsedData} onUpdateData={updateParsedData} />}

				{parsedData.length > 0 && (
					<div className='flex justify-center'>
						<Button size='lg' onClick={handleSaveToRUP}>
							Сохранить в РУП
						</Button>
					</div>
				)}
			</div>
		</div>
	)
}

export default Page
