import { lazy, Suspense } from 'react'
import { Navigate, Outlet, useParams, type RouteObject } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { PageLoader } from '@/components/feedback/states'
import { selectIsAuthenticated } from '@/features/auth/slices/authSlice'
import { NotificationStream } from '@/features/notifications/hooks/useNotifications'
import { looksLikeRoomCode } from '@/features/room/utils/roomCode'
import NotFoundPage from '@/pages/NotFoundPage'
import RouteErrorPage from '@/pages/RouteErrorPage'
import { GuestRoute, ProtectedRoute } from '@/routes/guards'
import { paths } from '@/routes/paths'

const LandingPage = lazy(() => import('@/features/landing/pages/LandingPage'))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const InterviewsPage = lazy(() => import('@/features/interviews/pages/InterviewsPage'))
const NewInterviewPage = lazy(() => import('@/features/interviews/pages/NewInterviewPage'))
const InterviewDetailsPage = lazy(() => import('@/features/interviews/pages/InterviewDetailsPage'))
const InterviewFeedbackPage = lazy(() => import('@/features/feedback/pages/InterviewFeedbackPage'))
const FeedbackPage = lazy(() => import('@/features/feedback/pages/FeedbackPage'))
const ProblemsPage = lazy(() => import('@/features/problems/pages/ProblemsPage'))
const ProblemDetailsPage = lazy(() => import('@/features/problems/pages/ProblemDetailsPage'))
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'))
const PublicProfilePage = lazy(() => import('@/features/profile/pages/PublicProfilePage'))
const JoinRoomPage = lazy(() => import('@/features/room/pages/JoinRoomPage'))
const RoomPage = lazy(() => import('@/features/room/pages/RoomPage'))
const SystemDesignMockInterviewPage = lazy(() => import('@/features/marketing/pages/SystemDesignMockInterviewPage'))
const MockCodingInterviewPage = lazy(() => import('@/features/marketing/pages/MockCodingInterviewPage'))
const MockInterviewWithAFriendPage = lazy(() => import('@/features/marketing/pages/MockInterviewWithAFriendPage'))
const FeedbackRubricPage = lazy(() => import('@/features/marketing/pages/FeedbackRubricPage'))

/**
 * `/:code` is the room; anything that isn't shaped like a code is a 404 (typos of app pages), checked
 * before sign-in so signed-out visitors see "Page not found", matching the 404 status nginx sends.
 */
function RoomCodeOnly() {
  const { code = '' } = useParams()
  return looksLikeRoomCode(code) ? <Outlet /> : <NotFoundPage />
}

function RoomRoute() {
  const { code = '' } = useParams()
  return (
    <Suspense fallback={<PageLoader label="Preparing the room…" />}>
      <RoomPage key={code.toLowerCase()} />
    </Suspense>
  )
}

/** App-wide pieces that need the router: the live notification stream (idle when signed out). */
function RootShell() {
  return (
    <>
      <NotificationStream />
      <Outlet />
    </>
  )
}

/** `/` is the dashboard when signed in and the landing page otherwise. */
function HomeRoute() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  if (isAuthenticated) return <AppLayout />
  return (
    <Suspense fallback={<PageLoader />}>
      <LandingPage />
    </Suspense>
  )
}

/** Public, prerendered content pages (see src/seo/site.ts); the same for signed-in and signed-out visitors. */
function PublicPage({ page: Page }: { page: React.ComponentType }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Page />
    </Suspense>
  )
}

/** Old links (emails, bookmarks) keep working. */
function LegacyRoomRedirect() {
  const { roomId = '' } = useParams()
  return <Navigate to={paths.room(roomId)} replace />
}

/** Shared by the browser router (main.tsx) and the build-time prerender (entry-prerender.tsx). */
export const routes: RouteObject[] = [
  {
    element: <RootShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: paths.home, element: <HomeRoute />, children: [{ index: true, element: <DashboardPage /> }] },

      {
        element: <GuestRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: paths.login, element: <LoginPage /> },
              { path: paths.signup, element: <RegisterPage /> },
              { path: paths.forgotPassword, element: <ForgotPasswordPage /> },
            ],
          },
        ],
      },

      // Public content pages.
      { path: paths.systemDesignMockInterview, element: <PublicPage page={SystemDesignMockInterviewPage} /> },
      { path: paths.mockCodingInterview, element: <PublicPage page={MockCodingInterviewPage} /> },
      { path: paths.mockInterviewWithAFriend, element: <PublicPage page={MockInterviewWithAFriendPage} /> },
      { path: paths.feedbackRubric, element: <PublicPage page={FeedbackRubricPage} /> },

      // Reachable signed in or out: the emailed link can be opened from any state.
      { element: <AuthLayout />, children: [{ path: paths.resetPassword, element: <ResetPasswordPage /> }] },

      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: paths.interviews, element: <InterviewsPage /> },
              { path: paths.newInterview, element: <NewInterviewPage /> },
              { path: '/interviews/:interviewId', element: <InterviewDetailsPage /> },
              { path: '/interviews/:interviewId/feedback', element: <InterviewFeedbackPage /> },
              { path: paths.feedback, element: <FeedbackPage /> },
              { path: paths.problems, element: <ProblemsPage /> },
              { path: '/problems/:slug', element: <ProblemDetailsPage /> },
              { path: paths.settings, element: <ProfilePage /> },
              { path: '/u/:username', element: <PublicProfilePage /> },
              { path: paths.join, element: <JoinRoomPage /> },
            ],
          },
        ],
      },

      // Full-screen interview room (pre-join, lobby, call and "ended" states), outside the app chrome.
      {
        path: '/:code',
        element: <RoomCodeOnly />,
        children: [{ element: <ProtectedRoute />, children: [{ index: true, element: <RoomRoute /> }] }],
      },

      // Legacy URLs.
      { path: '/dashboard', element: <Navigate to={paths.home} replace /> },
      { path: '/register', element: <Navigate to={paths.signup} replace /> },
      { path: '/profile', element: <Navigate to={paths.settings} replace /> },
      { path: '/settings', element: <Navigate to={paths.settings} replace /> },
      { path: '/room/join', element: <Navigate to={paths.join} replace /> },
      { path: '/room/join/:roomId', element: <LegacyRoomRedirect /> },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
