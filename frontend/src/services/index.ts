import { AiService } from './ai.service'
import { AuthService } from './auth.service'
import { AwardService } from './award.service'
import { CategoriesService } from './categories.service'
import { GroupService } from './group.service'
import { HikService } from './hik.service'
import { LessonService } from './lesson.service'
import { RupService } from './rup.service'
import { UserService } from './user.service'

// exporting services
export const services = {
	ai: new AiService(),
	auth: new AuthService(),
	user: new UserService(),
	rup: new RupService(),
	group: new GroupService(),
	award: new AwardService(),
	categories: new CategoriesService(),
	lesson: new LessonService(),
	hik: new HikService(),
}
