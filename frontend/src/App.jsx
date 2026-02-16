import { Routes, Route, Navigate } from 'react-router-dom'
import { getToken } from './api/auth'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { RegisterSuccess } from './pages/RegisterSuccess'
import { ResetPassword } from './pages/ResetPassword'
import { ResetPasswordSent } from './pages/ResetPasswordSent'
import { Dashboard } from './pages/Dashboard'
import { MemberList } from './pages/member/MemberList'
import { AddMember } from './pages/member/AddMember'
import { MemberDetail } from './pages/member/MemberDetail'
import { TimeMachine } from './pages/TimeMachine'
import { Alerts } from './pages/Alerts'
import { Profile } from './pages/Profile'

export default function App() {
  function HomeIndex() {
    try {
      if (getToken()) return <Navigate to="/dashboard" replace />
    } catch {}
    return <Landing />
  }
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomeIndex />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="register/success" element={<RegisterSuccess />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="reset-password/sent" element={<ResetPasswordSent />} />
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard/member" element={<MemberList />} />
          <Route path="dashboard/member/add" element={<AddMember />} />
          <Route path="dashboard/member/:id" element={<MemberDetail />} />
          <Route path="dashboard/time-machine" element={<TimeMachine />} />
          <Route path="dashboard/alerts" element={<Alerts />} />
          <Route path="dashboard/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
