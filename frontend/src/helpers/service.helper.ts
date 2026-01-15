import type { IRupModule } from '@types'

export const renameRupModuleGroupIdToGroup = (rupModule): IRupModule => {
	const renamedRupModule = { ...rupModule, group: { ...rupModule.groupId, id: rupModule.groupId['keycloak_id'] } }

	delete renamedRupModule.groupId
	delete renamedRupModule.group['keycloak_id']

	return renamedRupModule
}

export const renameRupModulesGroupIdToGroup = (rupModule): IRupModule[] => {
	const result: IRupModule[] = []

	for (let i = 0; i < rupModule.length; i++) {
		const renamedRupModule = {
			...rupModule[i],
			group: { ...rupModule[i].groupId, id: rupModule[i].groupId['keycloak_id'] },
		}

		delete renamedRupModule.groupId
		delete renamedRupModule.group['keycloak_id']

		result.push(renamedRupModule)
	}

	return result
}
