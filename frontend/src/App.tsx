import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import SplashScreen from './components/SplashScreen'
import { AuthProvider } from './context/AuthContext'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminReviewPage from './pages/AdminReviewPage'
import AboutPage from './pages/AboutPage'
import DeveloperPage from './pages/DeveloperPage'
import FavoritesPage from './pages/FavoritesPage'
import LoginPage from './pages/LoginPage'
import MyTasksPage from './pages/MyTasksPage'
import NotificationPage from './pages/NotificationPage'
import PrivacyPage from './pages/PrivacyPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import TaskCreatePage from './pages/TaskCreatePage'
import TaskDetailPage from './pages/TaskDetailPage'
import TaskListPage from './pages/TaskListPage'
import TermsPage from './pages/TermsPage'

export default function App() {
  return (
    <AuthProvider>
      <SplashScreen />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<Layout />}>
            <Route path="/" element={<TaskListPage />} />
            <Route path="/tasks/new" element={<ProtectedRoute roles={['publisher', 'admin']} />}>
              <Route index element={<TaskCreatePage />} />
            </Route>
            <Route path="/tasks/:id" element={<TaskDetailPage />} />
            <Route path="/mine" element={<ProtectedRoute />}>
              <Route index element={<MyTasksPage />} />
            </Route>
            <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']} />}>
              <Route index element={<AdminDashboardPage />} />
            </Route>
            <Route path="/admin/users" element={<ProtectedRoute roles={['admin']} />}>
              <Route index element={<AdminUsersPage />} />
            </Route>
            <Route path="/admin/review" element={<ProtectedRoute roles={['admin']} />}>
              <Route index element={<AdminReviewPage />} />
            </Route>
            <Route path="/profile" element={<ProtectedRoute />}>
              <Route index element={<ProfilePage />} />
            </Route>
            <Route path="/notifications" element={<ProtectedRoute />}>
              <Route index element={<NotificationPage />} />
            </Route>
            <Route path="/favorites" element={<ProtectedRoute />}>
              <Route index element={<FavoritesPage />} />
            </Route>
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/developer" element={<DeveloperPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
