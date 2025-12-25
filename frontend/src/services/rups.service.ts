import { renameRupModuleGroupIdToGroup, renameRupModulesGroupIdToGroup } from '@/helpers'
import type { IRupModule } from '@/shared/types'

// get all rup modules
export const getAllRupModules = async (): Promise<IRupModule[] | false> => {
	try {
		const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/get-all-objects`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		})
		const json = await data.json()

		console.log(json)

		if (data.status >= 200 && data.status < 300) return renameRupModulesGroupIdToGroup(json)

		return false
	} catch (error) {
		console.error(error)

		return false
	}
}

// get rup module by id
export const getRupModuleById = async (id: string): Promise<IRupModule | false> => {
	try {
		const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/get-object?id=${id}`, {
			method: 'GET',
		})

		const json = await data.json()

		if (data.status >= 200 && data.status < 300) return renameRupModuleGroupIdToGroup(json)

		return false
	} catch (error) {
		console.error(error)

		return false
	}
}

// create rup module
interface ICreatingBodyRequest {
	data: Omit<Omit<IRupModule, 'id'>, 'group'> & { groupId: Omit<IRupModule['group'], 'id'> & { keycloak_id: string } }
}

export const createRupModule = async (newRupModule: Omit<IRupModule, 'id'>): Promise<IRupModule | false> => {
	try {
		const configuredRupModule: ICreatingBodyRequest = {
			data: { ...newRupModule, groupId: { ...newRupModule.group, keycloak_id: newRupModule.group.id } },
		}

		console.log(configuredRupModule)

		const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/create-object`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(configuredRupModule),
		})
		const json = await data.json()

		if (data.status >= 200 && data.status < 300) return renameRupModuleGroupIdToGroup(json)

		return false
	} catch (error) {
		console.error(error)

		return false
	}
}

// update rup module
interface IUpdatingBodyRequest {
	id: string
	data: Omit<IRupModule, 'id'> & { groupId: Omit<IRupModule['group'], 'id'> & { keycloak_id: string } }
}

export const updateRupModule = async (newRupModule: IRupModule): Promise<IRupModule | false> => {
	try {
		const configuredRupModule: IUpdatingBodyRequest = {
			id: newRupModule.id,
			data: { ...newRupModule, groupId: { ...newRupModule.group, keycloak_id: newRupModule.group.id } },
		}

		const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/update-object`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(configuredRupModule),
		})
		const json = await data.json()

		if (data.status >= 200 && data.status < 300) return renameRupModuleGroupIdToGroup(json)

		return false
	} catch (error) {
		console.error(error)

		return false
	}
}

// delete rup module by id
export const deleteRupModuleById = async (id: string): Promise<boolean> => {
	try {
		const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/delete-object?id=${id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
			},
		})

		if (data.status >= 200 && data.status < 300) return true

		return false
	} catch (error) {
		console.error(error)

		return false
	}
}
