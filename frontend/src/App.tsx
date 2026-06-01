import { BrowserRouter, Routes, Route } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import HomePage from "./pages/HomePage"
import ProtectedRoute from "./components/ProtectedRoute"
import RegisterPage from "./pages/RegisterPage"
import DocumentsPage from "./pages/DocumentsPage"
import CorbeillePage from "./pages/CorbeillePage"
import AdminDashboardPage from "./pages/AdminDashboardPage"
import AdminTokensPage from "./pages/AdminTokensPage"
import AdminUsersPage from "./pages/AdminUsersPage"
import AdminLogsPage from "./pages/AdminLogsPage"
import AdminStockagePage from "./pages/AdminStockagePage"
import AdminSantePage from "./pages/AdminSantePage"
import AdminRoute from "./components/AdminRoute"
import ToastContainer from "./components/ToastContainer"
import { AuthProvider } from "./contexts/AuthContext"
import { ToastProvider } from "./contexts/ToastContext"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/home" element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              } />
              <Route path="/documents" element={
                <ProtectedRoute>
                  <DocumentsPage />
                </ProtectedRoute>
              } />
              <Route path="/corbeille" element={
                <ProtectedRoute>
                  <CorbeillePage />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboardPage />
                </AdminRoute>
              } />
              <Route path="/admin/tokens" element={
                <AdminRoute>
                  <AdminTokensPage />
                </AdminRoute>
              } />
              <Route path="/admin/users" element={
                <AdminRoute>
                  <AdminUsersPage />
                </AdminRoute>
              } />
              <Route path="/admin/logs" element={
                <AdminRoute>
                  <AdminLogsPage />
                </AdminRoute>
              } />
              <Route path="/admin/stockage" element={
                <AdminRoute>
                  <AdminStockagePage />
                </AdminRoute>
              } />
              <Route path="/admin/sante" element={
                <AdminRoute>
                  <AdminSantePage />
                </AdminRoute>
              } />
            </Routes>
          </BrowserRouter>
          <ToastContainer />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
