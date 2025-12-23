import { AuthService } from './auth-service'
import { UserService } from './user-service'

export * from './rups-service'

// exporting services
export const services = {
	auth: new AuthService(),
	user: new UserService(),
}
