import { useState, useEffect, useRef } from "react";
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

// Session timeout duration in milliseconds (5 minutes)
const SESSION_TIMEOUT = 5 * 60 * 1000;

export default function App() {
  const [mode, setMode] = useState<"register" | "login" | "dashboard" | "loading">("loading");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // NEW: Session timeout states (ADDED)
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SESSION_TIMEOUT);
  
  // NEW: Refs to store timers (ADDED)
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // NEW: Function to reset all timers (ADDED)
  const resetTimers = () => {
    // Clear existing timers
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    
    // Hide warning if shown
    setShowTimeoutWarning(false);
    setTimeLeft(SESSION_TIMEOUT);
  };

  // NEW: Function to start new timers (ADDED)
  const startTimers = () => {
    resetTimers();
    
    // Start warning timer (30 seconds before logout)
    warningTimerRef.current = setTimeout(() => {
      setShowTimeoutWarning(true);
      // Start countdown for remaining 30 seconds
      startCountdown(30 * 1000);
    }, SESSION_TIMEOUT - (30 * 1000));
    
    // Start logout timer
    logoutTimerRef.current = setTimeout(() => {
      handleAutoLogout();
    }, SESSION_TIMEOUT);
  };

  // NEW: Function to start countdown timer (ADDED)
  const startCountdown = (duration: number) => {
    let remaining = duration;
    setTimeLeft(remaining);
    
    countdownTimerRef.current = setInterval(() => {
      remaining -= 1000;
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }
      }
    }, 1000);
  };

  // NEW: Function to handle user activity (ADDED)
  const handleUserActivity = () => {
    if (user) { // Only reset timers if user is logged in
      startTimers();
    }
  };

  // NEW: Function to handle auto-logout (ADDED)
  const handleAutoLogout = () => {
    alert("Your session has expired due to inactivity. Please log in again.");
    handleLogout();
  };

  // NEW: Function to continue session (ADDED)
  const handleContinueSession = () => {
    resetTimers();
    startTimers();
  };

  // NEW: Set up event listeners for user activity (ADDED)
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      handleUserActivity();
    };
    
    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });
    
    // Initial timer setup if user is logged in
    if (user) {
      startTimers();
    }
    
    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      resetTimers();
    };
  }, [user]); // Re-run when user changes

  // EXISTING CODE BELOW (UNCHANGED)
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
    // NEW: Start timers on login (ADDED)
    startTimers();
  };

  const handleLogout = () => {
    // NEW: Clear timers on logout (ADDED)
    resetTimers();
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
    return (
      <>
        {/* NEW: Session Timeout Warning Modal (ADDED) */}
        {showTimeoutWarning && (
          <div className="timeout-warning-overlay">
            <div className="timeout-warning-modal">
              <div className="timeout-warning-header">
                <h3>⏰ Session Timeout Warning</h3>
                <button 
                  className="close-btn" 
                  onClick={handleContinueSession}
                >
                  ✕
                </button>
              </div>
              <div className="timeout-warning-body">
                <div className="warning-icon">⚠️</div>
                <p>
                  Your session will expire in <strong>{Math.ceil(timeLeft / 1000)} seconds</strong> 
                  due to inactivity.
                </p>
                <p>Do you want to continue your session?</p>
              </div>
              <div className="timeout-warning-actions">
                <button 
                  className="timeout-btn continue-btn"
                  onClick={handleContinueSession}
                >
                  👆 Continue Session
                </button>
                <button 
                  className="timeout-btn logout-btn"
                  onClick={handleLogout}
                >
                  🚪 Logout Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EXISTING: Main Content (UNCHANGED) */}
        {user.role === "admin" ? (
          <AdminPanel user={user} onLogout={handleLogout} />
        ) : (
          <StudentDashboard user={user} onLogout={handleLogout} />
        )}
      </>
    );
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