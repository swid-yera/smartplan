import type { QueryClient, QueryKey } from '@tanstack/react-query'

type QueryKeyInput = QueryKey | ((deletedId: string) => QueryKey)

export interface IDeleteCacheOptions {
	invalidateQueryKeys?: QueryKeyInput[]
	removeQueryKeys?: QueryKeyInput[]
}

const resolveQueryKey = (queryKey: QueryKeyInput, deletedId: string): QueryKey => {
	return typeof queryKey === 'function' ? queryKey(deletedId) : queryKey
}

export const cleanupDeleteCache = (
	queryClient: QueryClient,
	deletedId: string,
	options: IDeleteCacheOptions = {},
): void => {
	options.invalidateQueryKeys?.forEach((queryKey) => {
		queryClient.invalidateQueries({ queryKey: resolveQueryKey(queryKey, deletedId) })
	})

	options.removeQueryKeys?.forEach((queryKey) => {
		queryClient.removeQueries({ queryKey: resolveQueryKey(queryKey, deletedId) })
	})
}
