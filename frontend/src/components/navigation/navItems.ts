import { CalendarPlus, DoorOpen, History, LayoutDashboard, Star, UserRound, type LucideIcon } from 'lucide-react'
import { paths } from '@/routes/paths'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Match only the exact path (for parents of other nav items). */
  end?: boolean
}

export const primaryNav: NavItem[] = [
  { to: paths.dashboard, label: 'Dashboard', icon: LayoutDashboard },
  { to: paths.newInterview, label: 'New interview', icon: CalendarPlus },
  { to: paths.joinRoom, label: 'Join a room', icon: DoorOpen, end: true },
  { to: paths.interviews, label: 'Interview history', icon: History, end: true },
  { to: paths.feedback, label: 'Feedback', icon: Star },
  { to: paths.profile, label: 'Profile', icon: UserRound },
]
