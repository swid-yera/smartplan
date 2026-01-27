import { AuthService } from './auth.service'
import { AwardService } from './award.service'
import { GroupService } from './group.service'
import { LessonService } from './lesson.service'
import { RupService } from './rup.service'
import { UserService } from './user.service'

// exporting services
export const services = {
	auth: new AuthService(),
	user: new UserService(),
	rup: new RupService(),
	group: new GroupService(),
	award: new AwardService(),
	lesson: new LessonService(),
}
