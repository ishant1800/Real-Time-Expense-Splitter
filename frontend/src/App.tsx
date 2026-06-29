import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import Expenses from './pages/Expenses';
import Settlements from './pages/Settlements';
import Landing from './pages/Landing';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { useAuthStore } from './store/useAuthStore';

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

function App() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<PageTransition>{isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />}</PageTransition>} />
        <Route path="/login" element={<PageTransition>{isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}</PageTransition>} />
        <Route path="/register" element={<PageTransition>{isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}</PageTransition>} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
            <Route path="/groups" element={<PageTransition><Groups /></PageTransition>} />
            <Route path="/groups/:groupId" element={<PageTransition><GroupDetail /></PageTransition>} />
            <Route path="/expenses" element={<PageTransition><Expenses /></PageTransition>} />
            <Route path="/settlements" element={<PageTransition><Settlements /></PageTransition>} />
          </Route>
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
