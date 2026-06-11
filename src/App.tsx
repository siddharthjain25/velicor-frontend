import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ServicesPage } from './pages/Services'
import { ServiceLogsPage } from './pages/ServiceLogs'
import { Profile } from './pages/Profile'
import { Home } from './pages/Home'
import { AlertsPage } from './pages/Alerts'
import { Navbar } from './components/Navbar'

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="w-full px-4 md:px-8 flex-grow animate-in fade-in duration-500 py-4">
        <main>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/services" 
              element={
                <PrivateRoute>
                  <ServicesPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/services/:serviceName" 
              element={
                <PrivateRoute>
                  <ServiceLogsPage />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/alerts" 
              element={
                <PrivateRoute>
                  <AlertsPage />
                </PrivateRoute>
              } 
            />
            <Route path="/" element={<Home />} />
          </Routes>
        </main>
      </div>
      
      <footer className="mt-auto w-full py-8 px-4 md:px-8 border-t border-border/40 text-center sm:text-left">
        <p className="text-xs md:text-sm font-medium text-muted-foreground">Velicor Systems &copy; 2026. All systems operational.</p>
      </footer>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
