import { Link, NavLink } from 'react-router-dom'
import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Avatar } from '@/components/common/Avatar'
import { LogoMark } from '@/components/common/Logo'
import { primaryNav } from '@/components/navigation/navItems'
import { useLogout } from '@/features/auth/hooks/useAuthMutations'
import { selectCurrentUser } from '@/features/auth/slices/authSlice'
import { useMyProfile } from '@/features/profile/hooks/useProfile'
import { EXPERIENCE_LEVEL_LABELS, labelFor } from '@/constants/enums'
import { mobileNavClosed, selectSidebarCollapsed, sidebarToggled } from '@/store/uiSlice'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

interface SidebarProps {
  /** Rendered inside the mobile drawer: always expanded, closes on navigation. */
  variant?: 'desktop' | 'mobile'
}

export function Sidebar({ variant = 'desktop' }: SidebarProps) {
  const dispatch = useAppDispatch()
  const storedCollapsed = useAppSelector(selectSidebarCollapsed)
  const collapsed = variant === 'desktop' && storedCollapsed
  const user = useAppSelector(selectCurrentUser)
  const { data: profile } = useMyProfile()
  const logout = useLogout()

  const closeMobile = () => {
    if (variant === 'mobile') dispatch(mobileNavClosed())
  }

  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-16 items-center border-b border-border', collapsed ? 'justify-center px-2' : 'justify-between px-4')}>
        <Link to={paths.dashboard} onClick={closeMobile} className="flex items-center gap-2" aria-label="InnerView dashboard">
          <LogoMark size={28} />
          {!collapsed && <span className="text-base font-bold tracking-tight">InnerView</span>}
        </Link>
        {variant === 'desktop' && !collapsed && (
          <button
            onClick={() => dispatch(sidebarToggled())}
            className="rounded-md p-1.5 text-fg-muted hover:bg-elevated hover:text-fg"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <div className="flex justify-center py-2">
          <button
            onClick={() => dispatch(sidebarToggled())}
            className="rounded-md p-1.5 text-fg-muted hover:bg-elevated hover:text-fg"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      )}

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3" aria-label="Main">
        {primaryNav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={closeMobile}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-2',
                isActive ? 'bg-primary/15 text-primary-hover' : 'text-fg-secondary hover:bg-elevated hover:text-fg',
              )
            }
          >
            <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
            {!collapsed && <span>{label}</span>}
            {collapsed && <span className="sr-only">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-2">
        <Link
          to={paths.profile}
          onClick={closeMobile}
          className={cn('flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-elevated', collapsed && 'justify-center')}
          title={collapsed ? user?.email : undefined}
        >
          <Avatar label={user?.email ?? '?'} src={profile?.image_url} size={32} />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-fg">{user?.email}</p>
              <p className="truncate text-xs text-fg-muted">
                {profile ? labelFor(EXPERIENCE_LEVEL_LABELS, profile.experience_level) : 'No profile yet'}
              </p>
            </div>
          )}
        </Link>
        <button
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className={cn(
            'mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-fg-secondary hover:bg-elevated hover:text-fg disabled:opacity-50',
            collapsed && 'justify-center px-2',
          )}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="h-[18px] w-[18px]" aria-hidden />
          {collapsed ? <span className="sr-only">Sign out</span> : <span>{logout.isPending ? 'Signing out…' : 'Sign out'}</span>}
        </button>
      </div>
    </div>
  )
}
