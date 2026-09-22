import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Landing from './pages/Landing'
import Auth, { Onboarding } from './pages/Auth'
import Dashboard from './pages/Dashboard'
import FindInterview from './pages/FindInterview'
import MyInterviews from './pages/MyInterviews'
import CalendarPage from './pages/CalendarPage'
import Problems from './pages/Problems'
import LiveInterview from './pages/LiveInterview'
import FeedbackPage from './pages/FeedbackPage'
import ProfilePage from './pages/ProfilePage'
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'
import type { Page } from './data/mockData'

const APP_PAGES: Page[] = [
  'dashboard', 'find-interview', 'my-interviews', 'calendar',
  'problems', 'live-interview', 'feedback', 'profile', 'settings', 'notifications'
]

export default function App() {
  const [page, setPage] = useState<Page>('landing')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)

  const navigate = (p: Page) => setPage(p)

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const isApp = APP_PAGES.includes(page)
  const isFullscreen = page === 'live-interview' || page === 'system-design'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar — only in app pages, not fullscreen */}
      {isApp && !isFullscreen && (
        <Sidebar
          currentPage={page}
          onNavigate={navigate}
          onLogout={() => navigate('landing')}
        />
      )}

      {/* Main content */}
      <main style={{ flex: 1, overflowY: isFullscreen ? 'hidden' : 'auto', minWidth: 0 }}>
        {page === 'landing' && <Landing onNavigate={navigate} />}
        {page === 'login' && <Auth mode="login" onNavigate={navigate} />}
        {page === 'register' && <Auth mode="register" onNavigate={navigate} />}
        {page === 'onboarding' && <Onboarding onNavigate={navigate} />}
        {page === 'dashboard' && <Dashboard onNavigate={navigate} />}
        {page === 'find-interview' && <FindInterview onNavigate={navigate} />}
        {page === 'my-interviews' && <MyInterviews onNavigate={navigate} />}
        {page === 'calendar' && <CalendarPage onNavigate={navigate} />}
        {page === 'problems' && <Problems />}
        {page === 'live-interview' && <LiveInterview onNavigate={navigate} />}
        {page === 'feedback' && <FeedbackPage onNavigate={navigate} />}
        {page === 'profile' && <ProfilePage />}
        {page === 'settings' && <Settings />}
        {page === 'notifications' && <Notifications onNavigate={navigate} />}
      </main>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          padding: '12px 18px', borderRadius: 10,
          background: toast.type === 'success' ? '#22C55E' : toast.type === 'error' ? '#EF4444' : 'var(--elevated)',
          color: 'white', fontSize: 14, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.1)',
          animation: 'fadeIn 0.3s ease',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'} {toast.msg}
        </div>
      )}
    </div>
  )
}
