import type { IRup } from '@types'
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui'

interface GeneralInfoTabProps {
	rup: IRup
	updateRup: (updates: Partial<IRup>) => void
}

export const GeneralInfoTab = ({ rup, updateRup }: GeneralInfoTabProps) => {
	return (
		<div className='space-y-4'>
			<div className='space-y-2'>
				<Label htmlFor='programName'>Название программы</Label>
				<Input
					id='programName'
					value={rup.programName}
					onChange={(e) => updateRup({ programName: e.target.value })}
				/>
			</div>
			<div className='space-y-2'>
				<Label htmlFor='academicYear'>Учебный год</Label>
				<Input
					id='academicYear'
					value={rup.academicYear}
					onChange={(e) => updateRup({ academicYear: e.target.value })}
				/>
			</div>
			<div className='space-y-2'>
				<Label htmlFor='specialtyCode'>Код специальности</Label>
				<Input
					id='specialtyCode'
					value={rup.specialtyCode}
					onChange={(e) => updateRup({ specialtyCode: e.target.value })}
				/>
			</div>
			<div className='space-y-2'>
				<Label htmlFor='formOfStudy'>Форма обучения</Label>
				<Select value={rup.formOfStudy} onValueChange={(value) => updateRup({ formOfStudy: value })}>
					<SelectTrigger>
						<SelectValue placeholder='Выберите форму обучения' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='Full-time'>Очная</SelectItem>
						<SelectItem value='Part-time'>Заочная</SelectItem>
						<SelectItem value='Distance'>Дистанционная</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className='space-y-2'>
				<Label htmlFor='totalWeeks'>Общее количество недель</Label>
				<Input
					id='totalWeeks'
					type='number'
					value={rup.totalWeeks}
					onChange={(e) => updateRup({ totalWeeks: parseInt(e.target.value) || 0 })}
				/>
			</div>
			<div className='space-y-2'>
				<Label htmlFor='totalHours'>Общее количество часов</Label>
				<Input
					id='totalHours'
					type='number'
					value={rup.totalHours}
					onChange={(e) => updateRup({ totalHours: parseInt(e.target.value) || 0 })}
				/>
			</div>
		</div>
	)
}
