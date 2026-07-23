import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Calculator from './pages/Calculator';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/calculadora" element={<Calculator />} />
            <Route path="/produtos" element={<Products />} />
            <Route path="/vendas" element={<Sales />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/configuracoes" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/calculadora" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
