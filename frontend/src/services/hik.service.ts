import { renderApi } from '@lib'
import { mutationOptions } from '@tanstack/react-query'

export class HikService {
	hikToReportOptions = () => {
		return mutationOptions({
			mutationFn: async (file: File) => {
				const formData = new FormData()

				formData.append('file', file)

				const { data } = await renderApi.post('/hik-to-report', formData, {
					responseType: 'blob',
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				})

				// blob
				return data
			},

			onSuccess: (data) => {
				const url = window.URL.createObjectURL(new Blob([data]))
				const link = document.createElement('a')

				link.href = url

				const timestamp = new Date().toISOString().split('T')[0]

				link.setAttribute('download', `report_${timestamp}.xlsx`)

				document.body.appendChild(link)
				link.click()

				link.parentNode?.removeChild(link)
				window.URL.revokeObjectURL(url)
			},
		})
	}
}
