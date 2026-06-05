import { api } from '@lib'
import { queryOptions } from '@tanstack/react-query'
import type { IDepartmentTopTeachersResponse } from '@types'

import { getCurrentBackendLocale } from './service-locale'

export class StatisticsService {
	getTopTeachersByDepartmentOptions = () => {
		const locale = getCurrentBackendLocale()

		return queryOptions<IDepartmentTopTeachersResponse[]>({
			queryKey: ['statistics-top-teachers-by-department', locale],
			queryFn: async () => {
				const { data } = await api.get<IDepartmentTopTeachersResponse[]>('/statistics/departments/top-teachers', {
					params: { locale },
				})

				if (!data) return []

				return data
			},
		})
	}

	getTeachersByDepartmentOptions = (departmentId: string) => {
		const locale = getCurrentBackendLocale()

		return queryOptions<IDepartmentTopTeachersResponse | null>({
			queryKey: ['statistics-teachers-by-department', departmentId, locale],
			queryFn: async () => {
				try {
					const { data } = await api.get<IDepartmentTopTeachersResponse>(
						`/statistics/departments/${departmentId}/teachers`,
						{
							params: { locale },
						},
					)

					return data ?? null
				} catch (error) {
					if (typeof error === 'object' && error && 'response' in error) {
						const status = (error as { response?: { status?: number } }).response?.status

						if (status === 404) return null
					}

					throw error
				}
			},
		})
	}
}
