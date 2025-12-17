export interface IGroup {
	id: string
	name: string
	specialty: string
	qualification: string
}

export interface IUser {
	name: string
	secondName: string
	roles: string[] // TODO:
	phone: string
	email: string
}
