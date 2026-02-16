import { Navigate, Outlet, useLocation } from 'react-router-dom'

function hasToken() {
  try {
    return !!localStorage.getItem('auth_token')
  } catch {
    return false
  }
}

export function ProtectedRoute() {
  const location = useLocation()
  if (!hasToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}
