import type { IAward, ViolationEnum } from './award.type'
import type { LocalizedText } from './locale.type'
import type { IRup } from './rup.type'
import type { IViolationRecord } from './violation.type'

export enum StatusEnum {
	DRAFT = 'DRAFT',
	IN_REVIEW = 'IN_REVIEW',
	APPROVED = 'APPROVED',
	REJECTED = 'REJECTED',
}

export enum RoleEnum {
	TEACHER = 'TEACHER',
	METHODIST = 'METHODIST',
	ADMIN = 'ADMIN',
	SPECIAL = 'SPECIAL',
}

export enum PermissionCodeEnum {
	RUP_MANAGE = 'RUP-manage',
	RUP_VIEW = 'RUP-view',
	RUP_FULL = 'RUP-full',
	KPI_MANAGE = 'KPI-manage',
	KPI_VIEW = 'KPI-view',
	KPI_FULL = 'KPI-full',
}

export interface IGroup {
	keycloakId: string
	name: string
	specialty: LocalizedText
	qualification: LocalizedText
}

export interface IPagination<T> {
	data: T[]
	meta: {
		currentPage: number
		pages: number
		total: number
		pageSize: number
	}
}

export interface IUser {
	keycloakId: string

	username: string
	email?: string
	role: RoleEnum
	permissions?: PermissionCodeEnum[]

	firstName: string
	lastName: string
	phone: string
	departments?: IUserDepartment[]

	rups?: IRup[]
	totalPoints?: number
	awards?: IAward[]
	violation?: ViolationEnum
	violations?: IViolationRecord[]

	createdAt: string
	updatedAt: string
}

export interface IUserDepartment {
	keycloakId: string
	name: LocalizedText
}

// resources
export interface IResources {
	id: string
	name: string
	link?: string
}

// guides
export interface IGuide {
	id: string
	title: string
	description: string
	category: string
	level: 'beginner' | 'intermediate' | 'advanced'
	updatedAt: string
}
