import React, { useState } from "react";
import "../../styles/Auth.css";

type LoginResponse = {
  success: boolean;
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'admin';
    grade: string;
    maxAttempts: number;
    attemptsUsed: number;
  };
};

export default function StudentLogin({ onLogin, onRegisterClick }: { onLogin: (user: any, token: string) => void; onRegisterClick: () => void }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "student" as "student" | "admin"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password
        }),
      });

      const data: LoginResponse = await res.json();
      
      console.log("Login response:", data);
      
      if (res.ok && data.success) {
        // Check if the selected role matches the user's actual role
        if (form.role === "admin" && data.user.role !== "admin") {
          setError("You are not registered as an admin. Please login as a student.");
          return;
        }
        
        if (form.role === "student" && data.user.role === "admin") {
          setError("This is an admin account. Please select 'Login as Admin'.");
          return;
        }
        
        onLogin(data.user, data.token);
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2 className="login-title">Login to Reading & Learning System</h2>
      
      {error && <div className="error">{error}</div>}

      <div className="login-options">
        <button 
          className={`role-btn ${form.role === 'student' ? 'active' : ''}`}
          onClick={() => setForm({...form, role: 'student'})}
        >
          👨‍🎓 Login as Student
        </button>
        <button 
          className={`role-btn ${form.role === 'admin' ? 'active' : ''}`}
          onClick={() => setForm({...form, role: 'admin'})}
        >
          👨‍🏫 Login as Admin
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            className="auth-input"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            className="auth-input"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <input type="hidden" name="role" value={form.role} />

        <div className="role-info">
          {form.role === 'admin' ? (
            <p className="admin-note">
              💡 <strong>Admin Note:</strong> Admin accounts are created by system administrators. 
              If you need admin access, please contact the system administrator.
            </p>
          ) : (
            <p className="student-note">
              💡 <strong>Student Note:</strong> Students must register first before logging in.
            </p>
          )}
        </div>

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? "Logging in..." : `Login as ${form.role === 'admin' ? 'Admin' : 'Student'}`}
        </button>
      </form>

      {form.role === 'student' && (
        <div className="toggle-link">
          Don't have an account?{" "}
          <button onClick={onRegisterClick}>Register as Student</button>
        </div>
      )}
      
      {form.role === 'admin' && (
        <div className="toggle-link">
          Need to create an admin account?{" "}
          <button onClick={() => alert('Please contact system administrator to create admin accounts.')}>
            Contact Administrator
          </button>
        </div>
      )}
    </div>
  );
}