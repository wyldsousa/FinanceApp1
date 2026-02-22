import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { Dashboard } from '@/pages/Dashboard';
import { Transactions } from '@/pages/Transactions';
import { Cards } from '@/pages/Cards';
import { Investments } from '@/pages/Investments';
import { Categories } from '@/pages/Categories';
import { Reminders } from '@/pages/Reminders';
import { Reports } from '@/pages/Reports';
import { Assistant } from '@/pages/Assistant';
import { Profile } from '@/pages/Profile';
import { Banks } from '@/pages/Banks';
import './App.css';

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid #334155'
          }
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/banks" element={
          <ProtectedRoute>
            <Layout>
              <Banks />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/transactions" element={
          <ProtectedRoute>
            <Layout>
              <Transactions />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/cards" element={
          <ProtectedRoute>
            <Layout>
              <Cards />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/investments" element={
          <ProtectedRoute>
            <Layout>
              <Investments />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/categories" element={
          <ProtectedRoute>
            <Layout>
              <Categories />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/reminders" element={
          <ProtectedRoute>
            <Layout>
              <Reminders />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/assistant" element={
          <ProtectedRoute>
            <Layout>
              <Assistant />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
