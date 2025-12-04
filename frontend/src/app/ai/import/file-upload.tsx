import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@ui'

interface FileUploadProps {
	selectedFile: File | null
	programName: string
	academicYear: string
	isUploading: boolean
	onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
	onProgramNameChange: (value: string) => void
	onAcademicYearChange: (value: string) => void
	onUpload: () => void
}

export const FileUpload = ({
	selectedFile,
	programName,
	academicYear,
	isUploading,
	onFileSelect,
	onProgramNameChange,
	onAcademicYearChange,
	onUpload,
}: FileUploadProps) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Загрузка документа РУП</CardTitle>
			</CardHeader>
			<CardContent className='space-y-4'>
				<div className='space-y-2'>
					<Label htmlFor='file'>Выберите файл (PDF или DOCX)</Label>
					<Input accept='.pdf,.docx' disabled={isUploading} id='file' type='file' onChange={onFileSelect} />
					{selectedFile && <p className='text-sm text-gray-600 mt-1'>Выбран файл: {selectedFile.name}</p>}
				</div>

				<div className='grid grid-cols-2 gap-4'>
					<div className='space-y-2'>
						<Label htmlFor='program'>Название программы</Label>
						<Input
							disabled={isUploading}
							id='program'
							placeholder='Например: Информатика'
							value={programName}
							onChange={(e) => onProgramNameChange(e.target.value)}
						/>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='year'>Учебный год</Label>
						<Input
							disabled={isUploading}
							id='year'
							placeholder='Например: 2025-2026'
							value={academicYear}
							onChange={(e) => onAcademicYearChange(e.target.value)}
						/>
					</div>
				</div>

				<Button
					className='w-full'
					disabled={!selectedFile || !programName || !academicYear || isUploading}
					onClick={onUpload}
				>
					{isUploading ? 'Обработка...' : 'Загрузить и проанализировать'}
				</Button>
			</CardContent>
		</Card>
	)
}
