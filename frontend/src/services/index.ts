import { AuthService } from './auth.service'
import { GroupService } from './group.service'
import { RupService } from './rup.service'
import { UserService } from './user.service'

// exporting services
export const services = {
	auth: new AuthService(),
	user: new UserService(),
	rup: new RupService(),
	group: new GroupService(),
}
