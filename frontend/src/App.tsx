import { useState, useEffect } from "react";
import StudentDashboard from "./assets/components/StudentDashboard";
import StudentRegister from "./assets/components/StudentRegister";
import StudentLogin from "./assets/components/StudentLogin";
import AdminPanel from "./assets/components/AdminPanel";
import "./App.css";

type User = {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  grade: string;
  maxAttempts: number;
  attemptsUsed: number;
};

export default function App() {
  const [mode, setMode] = useState<"register" | "login" | "dashboard" | "loading">("loading");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        setMode('dashboard');
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setMode('login');
      }
    } else {
      setMode('login');
    }
  }, []);

  const handleLogin = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    setMode('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setMode('login');
  };

  // Show loading state
  if (mode === "loading") {
    return (
      <div className="app-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Registration Page
  if (mode === "register") {
    return (
      <div className="app-container">
        <StudentRegister onRegister={() => setMode("login")} />
      </div>
    );
  }

  // Login Page
  if (mode === "login") {
    return (
      <div className="app-container">
        <StudentLogin onLogin={handleLogin} onRegisterClick={() => setMode("register")} />
      </div>
    );
  }

  // Dashboard Views - Add null check
  if (mode === "dashboard" && user) {
    // Admin Dashboard
    if (user.role === "admin") {
      return <AdminPanel user={user} onLogout={handleLogout} />;
    }
    
    // Student Dashboard
    return <StudentDashboard user={user} onLogout={handleLogout} />;
  }

  // Fallback - if somehow we're in dashboard mode without a user
  return (
    <div className="app-container">
      <div className="error-message">
        <h2>Authentication Error</h2>
        <p>Session expired or invalid. Please log in again.</p>
        <button className="auth-button" onClick={handleLogout}>
          Go to Login
        </button>
      </div>
    </div>
  );
}