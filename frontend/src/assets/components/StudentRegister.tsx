import { useState } from "react";
import "../../styles/Auth.css";

export default function StudentRegister({ onRegister }: { onRegister: () => void }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    grade: "Grade 4"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }

    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          grade: form.grade,
          role: "student" // Force student role on registration
        }),
      });

      const data = await res.json();
      
      console.log("Registration response:", data);
      
      if (res.ok && data.success) {
        alert("🎉 Registration successful! Please login with your credentials.");
        onRegister();
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2 className="login-title">Student Registration</h2>
      <p className="register-subtitle">Register as a student to access learning materials and quizzes</p>
      
      {error && <div className="error">{error}</div>}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            className="auth-input"
            placeholder="Enter your full name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

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
          <label htmlFor="grade">Grade Level</label>
          <select
            id="grade"
            name="grade"
            className="auth-input"
            value={form.grade}
            onChange={handleChange}
            required
          >
            <option value="Grade 4">Grade 4</option>
            <option value="Grade 5">Grade 5</option>
            <option value="Grade 6">Grade 6</option>
            <option value="Grade 7">Grade 7</option>
            <option value="Grade 8">Grade 8</option>
            <option value="Grade 9">Grade 9</option>
            <option value="Grade 10">Grade 10</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            className="auth-input"
            placeholder="Enter password (min 6 characters)"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            className="auth-input"
            placeholder="Confirm your password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        <div className="terms-note">
          <p>📝 <strong>Note:</strong> This registration is for students only. 
          Admin accounts are created by system administrators.</p>
        </div>

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? "Registering..." : "Register as Student"}
        </button>
      </form>

      <div className="toggle-link">
        Already have an account?{" "}
        <button onClick={onRegister}>Login here</button>
      </div>
    </div>
  );
}