import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { PageLoader } from '@/components/feedback/states'
import NotFoundPage from '@/pages/NotFoundPage'
import RouteErrorPage from '@/pages/RouteErrorPage'
import { GuestRoute, ProtectedRoute } from '@/routes/guards'
import { paths } from '@/routes/paths'

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const InterviewsPage = lazy(() => import('@/features/interviews/pages/InterviewsPage'))
const NewInterviewPage = lazy(() => import('@/features/interviews/pages/NewInterviewPage'))
const FeedbackPage = lazy(() => import('@/features/feedback/pages/FeedbackPage'))
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'))
const JoinRoomPage = lazy(() => import('@/features/room/pages/JoinRoomPage'))
const RoomPage = lazy(() => import('@/features/room/pages/RoomPage'))

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate to={paths.dashboard} replace /> },

      {
        element: <GuestRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: paths.login, element: <LoginPage /> },
              { path: paths.register, element: <RegisterPage /> },
              { path: paths.forgotPassword, element: <ForgotPasswordPage /> },
            ],
          },
        ],
      },

      // Reachable signed in or out: the emailed link can be opened from any state.
      { element: <AuthLayout />, children: [{ path: paths.resetPassword, element: <ResetPasswordPage /> }] },

      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: paths.dashboard, element: <DashboardPage /> },
              { path: paths.interviews, element: <InterviewsPage /> },
              { path: paths.newInterview, element: <NewInterviewPage /> },
              { path: paths.feedback, element: <FeedbackPage /> },
              { path: paths.profile, element: <ProfilePage /> },
              { path: paths.joinRoom, element: <JoinRoomPage /> },
            ],
          },
          {
            // Full-screen interview room, outside the app chrome.
            path: '/room/join/:roomId',
            element: (
              <Suspense fallback={<PageLoader label="Preparing the room…" />}>
                <RoomPage />
              </Suspense>
            ),
          },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
