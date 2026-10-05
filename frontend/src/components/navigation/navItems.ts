import { BookOpen, CalendarPlus, DoorOpen, History, House, Star, UserRound, type LucideIcon } from 'lucide-react'
import { paths } from '@/routes/paths'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Match only the exact path (for parents of other nav items). */
  end?: boolean
}

export const primaryNav: NavItem[] = [
  { to: paths.home, label: 'Home', icon: House, end: true },
  { to: paths.newInterview, label: 'New interview', icon: CalendarPlus },
  { to: paths.join, label: 'Join with a code', icon: DoorOpen, end: true },
  { to: paths.interviews, label: 'Interviews', icon: History, end: true },
  { to: paths.problems, label: 'Problems', icon: BookOpen },
  { to: paths.feedback, label: 'Feedback', icon: Star },
  { to: paths.settings, label: 'Settings', icon: UserRound },
]
