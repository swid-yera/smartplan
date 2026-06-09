import { AiService } from './ai.service'
import { AuthService } from './auth.service'
import { AwardService } from './award.service'
import { DepartmentService } from './department.service'
import { CategoriesService } from './categories.service'
import { GroupService } from './group.service'
import { HikService } from './hik.service'
import { LessonService } from './lesson.service'
import { PermissionService } from './permission.service'
import { RupService } from './rup.service'
import { StatisticsService } from './statistics.service'
import { UserService } from './user.service'

// exporting services
export const services = {
	ai: new AiService(),
	auth: new AuthService(),
	user: new UserService(),
	rup: new RupService(),
	group: new GroupService(),
	department: new DepartmentService(),
	award: new AwardService(),
	categories: new CategoriesService(),
	lesson: new LessonService(),
	permission: new PermissionService(),
	statistics: new StatisticsService(),
	hik: new HikService(),
}
