import { api } from '@lib'
import { mutationOptions, queryOptions, useQueryClient } from '@tanstack/react-query'
import type { IKpiUploadBlockDateResponse, IUpdateKpiUploadBlockDateRequest } from '@types'

export class KpiSettingsService {
	getUploadBlockDateOptions = () => {
		return queryOptions<IKpiUploadBlockDateResponse>({
			queryKey: ['kpi-upload-block-date'],
			queryFn: async () => {
				const { data } = await api.get<IKpiUploadBlockDateResponse>('/settings/kpi-upload-block-date')

				return data ?? { blockedAfterDate: null, exceptionUserIds: [], canBypassUploadLock: false }
			},
		})
	}

	setUploadBlockDateOptions = () => {
		const queryClient = useQueryClient()

		return mutationOptions({
			mutationFn: async (payload: IUpdateKpiUploadBlockDateRequest) => {
				const { data } = await api.put<IKpiUploadBlockDateResponse>('/settings/kpi-upload-block-date', payload)

				return data
			},
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ['kpi-upload-block-date'] })
			},
		})
	}
}
