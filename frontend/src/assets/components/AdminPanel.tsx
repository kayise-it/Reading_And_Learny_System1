// Complete AdminPanel.tsx with sidebar, password change, notes view, quiz edit, preview, and working manual review
import React, { useEffect, useState } from "react";
import "../../styles/AdminPanel.css";

type User = {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  grade: string;
  maxAttempts: number;
  attemptsUsed: number;
  role?: string;
};

type Submission = {
  _id: string;
  studentId: User;
  contentId: {
    _id: string;
    mainTopic: string;
    subject: string;
  };
  score: number;
  total: number;
  answers: Array<{
    question: string;
    selected: string;
    correctAnswer: string;
    correct: boolean;
  }>;
  submittedAt: string;
  isManuallyReviewed: boolean;
  adminFeedback: string;
};

type Content = {
  _id: string;
  grade: string;
  subject: string;
  mainTopic: string;
  description: string;
  contentType: 'quiz' | 'notes';
  questions: Array<{
    question: string;
    options: string[];
    answer: string;
  }>;
  definitions: Array<{
    word: string;
    meaning: string;
  }>;
  subTopics: Array<{
    title: string;
    content: string;
  }>;
  createdAt: string;
};

// Quiz Form Data
type QuizFormData = {
  grade: string;
  subject: string;
  mainTopic: string;
  description: string;
  contentType: 'quiz';
  questions: Array<{
    question: string;
    options: string[];
    answer: string;
  }>;
};

// Notes Form Data
type NotesFormData = {
  grade: string;
  subject: string;
  mainTopic: string;
  description: string;
  contentType: 'notes';
  definitions: Array<{
    word: string;
    meaning: string;
  }>;
  subTopics: Array<{
    title: string;
    content: string;
  }>;
};

export default function AdminPanel({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'content' | 'submissions' | 'users'>('dashboard');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [editingAttempts, setEditingAttempts] = useState<{ [key: string]: number }>({});
  const [reviewingSubmission, setReviewingSubmission] = useState<Submission | null>(null);
  const [manualScore, setManualScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Content creation states
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [showNotesForm, setShowNotesForm] = useState(false);
  const [quizForm, setQuizForm] = useState<QuizFormData>({
    grade: "Grade 4",
    subject: "English",
    mainTopic: "",
    description: "",
    contentType: 'quiz',
    questions: [
      { 
        question: "", 
        options: ["", "", "", ""], 
        answer: "" 
      }
    ]
  });
  
  const [notesForm, setNotesForm] = useState<NotesFormData>({
    grade: "Grade 4",
    subject: "English",
    mainTopic: "",
    description: "",
    contentType: 'notes',
    definitions: [{ word: "", meaning: "" }],
    subTopics: [{ title: "", content: "" }]
  });
  
  const [contentError, setContentError] = useState("");
  const [contentSuccess, setContentSuccess] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'quiz' | 'notes'>('all');
  
  // Add mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dashboard stats
  const [stats, setStats] = useState({
    totalContent: 0,
    totalQuizzes: 0,
    totalNotes: 0,
    totalSubmissions: 0,
    totalUsers: 0
  });

  // Password change state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // New states for viewing notes, editing quizzes, and preview
  const [viewingNotes, setViewingNotes] = useState<Content | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Content | null>(null);
  const [previewContent, setPreviewContent] = useState<Content | null>(null);
  const [editQuizForm, setEditQuizForm] = useState<QuizFormData | null>(null);

  // Manual review states
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    calculateStats();
  }, [content, submissions, users]);

  const loadData = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    
    try {
      if (activeTab === 'submissions') {
        const res = await fetch("http://localhost:4000/api/submissions/admin/submissions", {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSubmissions(data);
        }
      } else if (activeTab === 'users') {
        const res = await fetch("http://localhost:4000/api/admin/users", {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } else if (activeTab === 'content' || activeTab === 'dashboard') {
        const res = await fetch("http://localhost:4000/api/admin/content", {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setContent(data);
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalQuizzes = content.filter(item => item.contentType === 'quiz').length;
    const totalNotes = content.filter(item => item.contentType === 'notes').length;
    
    setStats({
      totalContent: content.length,
      totalQuizzes,
      totalNotes,
      totalSubmissions: submissions.length,
      totalUsers: users.length
    });
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setContentError("");
    setContentSuccess("");
    
    // Validation
    if (!quizForm.mainTopic.trim()) {
      setContentError("Main topic is required");
      return;
    }
    
    if (!quizForm.description.trim()) {
      setContentError("Description is required");
      return;
    }
    
    // Validate questions
    for (let i = 0; i < quizForm.questions.length; i++) {
      const q = quizForm.questions[i];
      if (!q.question.trim()) {
        setContentError(`Question ${i + 1} is required`);
        return;
      }
      if (!q.answer.trim()) {
        setContentError(`Question ${i + 1} needs a correct answer`);
        return;
      }
      if (q.options.some(opt => !opt.trim())) {
        setContentError(`Question ${i + 1} has empty options`);
        return;
      }
    }

    const token = localStorage.getItem('token');
    setLoading(true);

    try {
      const endpoint = editingQuiz 
        ? `http://localhost:4000/api/admin/content/${editingQuiz._id}`
        : "http://localhost:4000/api/content";
      
      const method = editingQuiz ? "PUT" : "POST";
      
      const res = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingQuiz ? editQuizForm : quizForm),
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        setContentSuccess(editingQuiz ? "✅ Quiz updated successfully!" : "✅ Quiz created successfully!");
        // Reset form
        setQuizForm({
          grade: "Grade 4",
          subject: "English",
          mainTopic: "",
          description: "",
          contentType: 'quiz',
          questions: [{ question: "", options: ["", "", "", ""], answer: "" }]
        });
        setShowQuizForm(false);
        setEditingQuiz(null);
        setEditQuizForm(null);
        // Refresh content list
        loadData();
      } else {
        setContentError(data.error || data.message || `Failed to ${editingQuiz ? 'update' : 'create'} quiz`);
      }
    } catch (error) {
      setContentError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    setContentError("");
    setContentSuccess("");
    
    // Validation
    if (!notesForm.mainTopic.trim()) {
      setContentError("Main topic is required");
      return;
    }
    
    if (!notesForm.description.trim()) {
      setContentError("Description is required");
      return;
    }

    const token = localStorage.getItem('token');
    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/api/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(notesForm),
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        setContentSuccess("✅ Learning notes created successfully!");
        // Reset form
        setNotesForm({
          grade: "Grade 4",
          subject: "English",
          mainTopic: "",
          description: "",
          contentType: 'notes',
          definitions: [{ word: "", meaning: "" }],
          subTopics: [{ title: "", content: "" }]
        });
        setShowNotesForm(false);
        // Refresh content list
        loadData();
      } else {
        setContentError(data.error || data.message || "Failed to create notes");
      }
    } catch (error) {
      setContentError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert("Password must be at least 6 characters!");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch("http://localhost:4000/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert("✅ Password changed successfully!");
        setShowChangePassword(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        alert(`❌ ${data.message || "Failed to change password"}`);
      }
    } catch (error) {
      console.error("Error changing password:", error);
      alert("⚠️ Error changing password. Please try again.");
    }
  };

  // MANUAL REVIEW FUNCTIONALITY
  const handleManualReview = async () => {
    if (!reviewingSubmission) return;
    
    setReviewError("");
    setReviewSuccess("");
    
    // Validate score
    if (manualScore < 0 || manualScore > reviewingSubmission.total) {
      setReviewError(`Score must be between 0 and ${reviewingSubmission.total}`);
      return;
    }
    
    setReviewLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/submissions/${reviewingSubmission._id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          score: manualScore,
          feedback: feedback,
          isManuallyReviewed: true
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setReviewSuccess("✅ Manual review submitted successfully!");
        
        // Update local state
        const updatedSubmissions = submissions.map(sub => 
          sub._id === reviewingSubmission._id 
            ? { 
                ...sub, 
                score: manualScore, 
                adminFeedback: feedback,
                isManuallyReviewed: true 
              }
            : sub
        );
        setSubmissions(updatedSubmissions);
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          setReviewingSubmission(null);
          setManualScore(0);
          setFeedback("");
          setReviewSuccess("");
        }, 1500);
      } else {
        setReviewError(data.message || "Failed to submit manual review");
      }
    } catch (error) {
      console.error("Manual review error:", error);
      setReviewError("Network error. Please try again.");
    } finally {
      setReviewLoading(false);
    }
  };

  // Helper functions for quiz form
  const addQuizQuestion = () => {
    if (editingQuiz && editQuizForm) {
      setEditQuizForm({
        ...editQuizForm,
        questions: [...editQuizForm.questions, { question: "", options: ["", "", "", ""], answer: "" }]
      });
    } else {
      setQuizForm({
        ...quizForm,
        questions: [...quizForm.questions, { question: "", options: ["", "", "", ""], answer: "" }]
      });
    }
  };

  const removeQuizQuestion = (index: number) => {
    if (editingQuiz && editQuizForm) {
      if (editQuizForm.questions.length > 1) {
        const newQuestions = [...editQuizForm.questions];
        newQuestions.splice(index, 1);
        setEditQuizForm({ ...editQuizForm, questions: newQuestions });
      }
    } else {
      if (quizForm.questions.length > 1) {
        const newQuestions = [...quizForm.questions];
        newQuestions.splice(index, 1);
        setQuizForm({ ...quizForm, questions: newQuestions });
      }
    }
  };

  const updateQuizQuestion = (index: number, field: string, value: string | string[]) => {
    if (editingQuiz && editQuizForm) {
      const newQuestions = [...editQuizForm.questions];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      setEditQuizForm({ ...editQuizForm, questions: newQuestions });
    } else {
      const newQuestions = [...quizForm.questions];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      setQuizForm({ ...quizForm, questions: newQuestions });
    }
  };

  // Helper functions for notes form
  const addDefinition = () => {
    setNotesForm({
      ...notesForm,
      definitions: [...notesForm.definitions, { word: "", meaning: "" }]
    });
  };

  const removeDefinition = (index: number) => {
    const newDefinitions = [...notesForm.definitions];
    newDefinitions.splice(index, 1);
    setNotesForm({ ...notesForm, definitions: newDefinitions });
  };

  const addSubTopic = () => {
    setNotesForm({
      ...notesForm,
      subTopics: [...notesForm.subTopics, { title: "", content: "" }]
    });
  };

  const removeSubTopic = (index: number) => {
    const newSubTopics = [...notesForm.subTopics];
    newSubTopics.splice(index, 1);
    setNotesForm({ ...notesForm, subTopics: newSubTopics });
  };

  const resetAttempts = async (userId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:4000/api/admin/users/${userId}/reset-attempts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        alert("✅ Attempts reset successfully!");
        loadData();
      } else {
        const error = await res.json();
        alert(`❌ Error: ${error.message}`);
      }
    } catch (error) {
      console.error("Reset attempts error:", error);
      alert("❌ Failed to reset attempts");
    }
  };

  const deleteUser = async (userId: string) => {
    if (!userId) {
      alert("❌ Error: Invalid user ID");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this user? This will delete all their submissions.")) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:4000/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        alert("✅ User deleted successfully!");
        loadData();
      } else {
        alert(`❌ Error: ${data.message || data.error || 'Failed to delete user'}`);
      }
    } catch (error) {
      console.error("Delete user error:", error);
      alert("❌ Network error. Please try again.");
    }
  };

  const deleteContent = async (contentId: string) => {
    if (!window.confirm("Are you sure you want to delete this content? This action cannot be undone and will delete all related submissions.")) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:4000/api/admin/content/${contentId}`, {
        method: "DELETE",
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        alert("✅ Content deleted successfully!");
        // Remove the deleted content from state
        setContent(prevContent => prevContent.filter(item => item._id !== contentId));
      } else {
        alert(`❌ Error: ${data.message || data.error || 'Failed to delete content'}`);
      }
    } catch (error) {
      console.error("Delete content error:", error);
      alert("❌ Network error. Please try again.");
    }
  };

  // Edit quiz function
  const handleEditQuiz = (quiz: Content) => {
    setEditingQuiz(quiz);
    setEditQuizForm({
      grade: quiz.grade,
      subject: quiz.subject,
      mainTopic: quiz.mainTopic,
      description: quiz.description,
      contentType: 'quiz',
      questions: quiz.questions.map(q => ({
        question: q.question,
        options: q.options,
        answer: q.answer
      }))
    });
    setShowQuizForm(true);
  };

  // Filter content by type
  const filteredContent = content.filter(item => {
    if (filterType === 'all') return true;
    if (filterType === 'quiz') return item.contentType === 'quiz';
    if (filterType === 'notes') return item.contentType === 'notes';
    return true;
  });

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <h2>📚 EduMaster</h2>
          <p>Admin Dashboard</p>
        </div>
        
        <nav className="sidebar-nav">
          <a 
            href="#dashboard" 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('dashboard');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </a>
          
          <a 
            href="#content" 
            className={`nav-item ${activeTab === 'content' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('content');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon">📚</span>
            <span className="nav-text">Content Management</span>
          </a>
          
          <a 
            href="#submissions" 
            className={`nav-item ${activeTab === 'submissions' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('submissions');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon">📝</span>
            <span className="nav-text">Submissions</span>
          </a>
          
          <a 
            href="#users" 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('users');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-text">User Management</span>
          </a>
        </nav>
        
        <button className="logout-btn" onClick={onLogout}>
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="header-left">
            <button 
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <div>
              <h1>Welcome back, {user.name}!</h1>
              <p>
                <span>👨‍🏫</span>
                <span>System Administrator</span>
              </p>
            </div>
          </div>
          
          <div className="header-right">
            <button 
              className="change-password-btn" 
              onClick={() => setShowChangePassword(true)}
              title="Change Password"
            >
              🔐
            </button>
            <div className="admin-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          {/* Loading State */}
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading data...</p>
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && !loading && (
            <>
              {/* Dashboard Cards */}
              <div className="dashboard-cards">
                <div className="dashboard-card">
                  <div className="card-header">
                    <div className="card-icon blue">
                      📚
                    </div>
                  </div>
                  <div className="card-stats">{stats.totalContent}</div>
                  <div className="card-title">Total Content</div>
                  <div className="card-subtitle">Quizzes & Learning Materials</div>
                </div>
                
                <div className="dashboard-card">
                  <div className="card-header">
                    <div className="card-icon green">
                      📝
                    </div>
                  </div>
                  <div className="card-stats">{stats.totalQuizzes}</div>
                  <div className="card-title">Active Quizzes</div>
                  <div className="card-subtitle">Available for students</div>
                </div>
                
                <div className="dashboard-card">
                  <div className="card-header">
                    <div className="card-icon purple">
                      📖
                    </div>
                  </div>
                  <div className="card-stats">{stats.totalNotes}</div>
                  <div className="card-title">Learning Notes</div>
                  <div className="card-subtitle">Educational materials</div>
                </div>
                
                <div className="dashboard-card">
                  <div className="card-header">
                    <div className="card-icon orange">
                      👥
                    </div>
                  </div>
                  <div className="card-stats">{stats.totalUsers}</div>
                  <div className="card-title">Total Users</div>
                  <div className="card-subtitle">Students & Admins</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="content-header">
                <div className="content-header-top">
                  <h2>Quick Actions</h2>
                </div>
                
                <div className="creation-buttons">
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setActiveTab('content');
                      setTimeout(() => setShowQuizForm(true), 100);
                    }}
                  >
                    <span>📝</span>
                    <span>Create New Quiz</span>
                  </button>
                  
                  <button 
                    className="btn btn-success"
                    onClick={() => {
                      setActiveTab('content');
                      setTimeout(() => setShowNotesForm(true), 100);
                    }}
                  >
                    <span>📚</span>
                    <span>Create Learning Notes</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Content Management Tab */}
          {activeTab === 'content' && !loading && (
            <div className="tab-content">
              <div className="content-header">
                <div className="content-header-top">
                  <h2>Content Management</h2>
                  <div className="content-filters">
                    <button 
                      className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                      onClick={() => setFilterType('all')}
                    >
                      All Content
                    </button>
                    <button 
                      className={`filter-btn ${filterType === 'quiz' ? 'active' : ''}`}
                      onClick={() => setFilterType('quiz')}
                    >
                      📝 Quizzes
                    </button>
                    <button 
                      className={`filter-btn ${filterType === 'notes' ? 'active' : ''}`}
                      onClick={() => setFilterType('notes')}
                    >
                      📚 Learning Notes
                    </button>
                  </div>
                </div>
                
                <div className="creation-buttons">
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setShowQuizForm(true);
                      setEditingQuiz(null);
                      setEditQuizForm(null);
                    }}
                  >
                    <span>📝</span>
                    <span>Create New Quiz</span>
                  </button>
                  
                  <button 
                    className="btn btn-success"
                    onClick={() => setShowNotesForm(true)}
                  >
                    <span>📚</span>
                    <span>Create Learning Notes</span>
                  </button>
                </div>
              </div>
              
              {/* Error/Success Messages */}
              {contentError && (
                <div className="error-banner">
                  ❌ {contentError}
                </div>
              )}
              
              {contentSuccess && (
                <div className="success-banner">
                  ✅ {contentSuccess}
                </div>
              )}
              
              {/* Content List */}
              <div className="content-grid">
                {filteredContent.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📚</div>
                    <h3>No content available yet</h3>
                    <p>Start by creating quizzes or learning notes for your students.</p>
                    <div className="empty-state-buttons">
                      <button className="btn btn-primary" onClick={() => setShowQuizForm(true)}>
                        Create Your First Quiz
                      </button>
                      <button className="btn btn-success" onClick={() => setShowNotesForm(true)}>
                        Create Learning Notes
                      </button>
                    </div>
                  </div>
                ) : (
                  filteredContent.map((item) => (
                    <div key={item._id} className="content-card">
                      <div className="content-card-header">
                        <span className={`content-type-badge ${item.contentType === 'quiz' ? 'quiz' : 'notes'}`}>
                          {item.contentType === 'quiz' ? '📝 Quiz' : '📚 Notes'}
                        </span>
                        <button 
                          className="delete-btn"
                          onClick={() => deleteContent(item._id)}
                        >
                          <span>🗑️</span>
                          <span>Delete</span>
                        </button>
                      </div>
                      
                      <div className="content-card-body">
                        <h3 className="content-card-title">{item.mainTopic}</h3>
                        <p className="content-card-description">{item.description}</p>
                        
                        <div className="content-stats">
                          {item.contentType === 'quiz' ? (
                            <>
                              <span className="stat-item">
                                <span>📝</span>
                                <span>{item.questions?.length || 0} Questions</span>
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="stat-item">
                                <span>📚</span>
                                <span>{item.definitions?.length || 0} Terms</span>
                              </span>
                              <span className="stat-item">
                                <span>📖</span>
                                <span>{item.subTopics?.length || 0} Subtopics</span>
                              </span>
                            </>
                          )}
                          <span className="stat-item">
                            <span>🎯</span>
                            <span>{item.grade}</span>
                          </span>
                          <span className="stat-item">
                            <span>📅</span>
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="content-card-footer">
                        {item.contentType === 'quiz' ? (
                          <>
                            <button className="btn-outline" onClick={() => handleEditQuiz(item)}>
                              Edit Quiz
                            </button>
                            <button className="btn-outline" onClick={() => setPreviewContent(item)}>
                              Preview
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="btn-outline" onClick={() => setViewingNotes(item)}>
                              View Notes
                            </button>
                            <button className="btn-outline" onClick={() => setPreviewContent(item)}>
                              Preview
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Submissions Tab */}
          {activeTab === 'submissions' && !loading && (
            <div className="tab-content">
              <div className="content-header">
                <div className="content-header-top">
                  <h2>Student Quiz Submissions ({submissions.length})</h2>
                </div>
              </div>
              
              {submissions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📝</div>
                  <h3>No submissions yet</h3>
                  <p>Students need to complete quizzes first.</p>
                </div>
              ) : (
                <div className="submissions-grid">
                  {submissions.map((sub) => (
                    <div key={sub._id} className="submission-card">
                      <div className="submission-header">
                        <div className="student-info">
                          <div className="student-avatar">
                            {sub.studentId?.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <h4>{sub.studentId?.name || 'Student'}</h4>
                            <p>{sub.studentId?.email || ''} • {sub.studentId?.grade || ''}</p>
                          </div>
                        </div>
                        <div className={`score-badge ${sub.score >= sub.total * 0.7 ? 'good' : 'bad'}`}>
                          {sub.score}/{sub.total}
                        </div>
                      </div>

                      <div className="submission-details">
                        <p><strong>Topic:</strong> {sub.contentId?.mainTopic || 'Unknown Topic'}</p>
                        <p><strong>Submitted:</strong> {new Date(sub.submittedAt).toLocaleString()}</p>
                        {sub.isManuallyReviewed && (
                          <p className="reviewed-badge">✅ Manually Reviewed</p>
                        )}
                      </div>

                      <div className="submission-actions">
                        <button 
                          className="btn-outline"
                          onClick={() => setSelectedSubmission(sub)}
                        >
                          View Answers
                        </button>
                        <button 
                          className="btn btn-primary"
                          onClick={() => {
                            setReviewingSubmission(sub);
                            setManualScore(sub.score);
                            setFeedback(sub.adminFeedback || "");
                          }}
                        >
                          {sub.isManuallyReviewed ? 'Edit Review' : 'Manual Review'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && !loading && (
            <div className="tab-content">
              <div className="content-header">
                <div className="content-header-top">
                  <h2>Manage Users ({users.length})</h2>
                </div>
              </div>
              
              {users.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">👥</div>
                  <h3>No users found</h3>
                    <p>Users will appear here once registered.</p>
                </div>
              ) : (
                <div className="users-table-container">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Grade</th>
                        <th>Attempts Used</th>
                        <th>Max Attempts</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const userId = u._id || u.id || "";
                        return (
                        <tr key={userId}>
                          <td>
                            <div className="student-cell">
                              <div className="student-avatar-small">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <div>{u.name}</div>
                                <small>{u.email}</small>
                              </div>
                            </div>
                          </td>
                          <td>{u.grade}</td>
                          <td>{u.attemptsUsed}</td>
                          <td>
                            <input
                              type="number"
                              value={editingAttempts[userId] || u.maxAttempts}
                              onChange={(e) => setEditingAttempts({
                                ...editingAttempts,
                                [userId]: parseInt(e.target.value) || u.maxAttempts
                              })}
                              min="1"
                              max="10"
                              style={{ width: '60px' }}
                            />
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="btn-outline"
                                onClick={() => resetAttempts(userId)}
                              >
                                Reset Attempts
                              </button>
                              {u.role !== 'admin' && (
                                <button 
                                  className="delete-btn"
                                  onClick={() => deleteUser(userId)}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Quiz Form Modal */}
      {(showQuizForm || editingQuiz) && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingQuiz ? '📝 Edit Quiz' : '📝 Create New Quiz'}</h3>
              <button className="close-btn" onClick={() => {
                setShowQuizForm(false);
                setEditingQuiz(null);
                setEditQuizForm(null);
              }}>✕</button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleCreateQuiz}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Grade Level *</label>
                    <select
                      className="form-control"
                      value={editingQuiz ? editQuizForm?.grade || "Grade 4" : quizForm.grade}
                      onChange={(e) => {
                        if (editingQuiz && editQuizForm) {
                          setEditQuizForm({...editQuizForm, grade: e.target.value});
                        } else {
                          setQuizForm({...quizForm, grade: e.target.value});
                        }
                      }}
                      required
                    >
                      <option value="Grade 4">Grade 4</option>
                      <option value="Grade 5">Grade 5</option>
                      <option value="Grade 6">Grade 6</option>
                      <option value="Grade 7">Grade 7</option>
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Subject *</label>
                    <select
                      className="form-control"
                      value={editingQuiz ? editQuizForm?.subject || "English" : quizForm.subject}
                      onChange={(e) => {
                        if (editingQuiz && editQuizForm) {
                          setEditQuizForm({...editQuizForm, subject: e.target.value});
                        } else {
                          setQuizForm({...quizForm, subject: e.target.value});
                        }
                      }}
                      required
                    >
                      <option value="English">English</option>
                      <option value="Math">Math</option>
                      <option value="Science">Science</option>
                      <option value="History">History</option>
                      <option value="Geography">Geography</option>
                      <option value="Art">Art</option>
                      <option value="Life Skills">Life Skills</option>
                      <option value="Life Orientation">Life Orientation</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Quiz Topic *</label>
                  <input
                    className="form-control"
                    type="text"
                    value={editingQuiz ? editQuizForm?.mainTopic || "" : quizForm.mainTopic}
                    onChange={(e) => {
                      if (editingQuiz && editQuizForm) {
                        setEditQuizForm({...editQuizForm, mainTopic: e.target.value});
                      } else {
                        setQuizForm({...quizForm, mainTopic: e.target.value});
                      }
                    }}
                    placeholder="e.g., Multiplication Quiz, Grammar Test"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    className="form-control textarea-control"
                    value={editingQuiz ? editQuizForm?.description || "" : quizForm.description}
                    onChange={(e) => {
                      if (editingQuiz && editQuizForm) {
                        setEditQuizForm({...editQuizForm, description: e.target.value});
                      } else {
                        setQuizForm({...quizForm, description: e.target.value});
                      }
                    }}
                    placeholder="Brief description of what this quiz covers"
                    rows={3}
                    required
                  />
                </div>
                
                {/* Questions Section */}
                <div className="section-header">
                  <h4>Quiz Questions <span className="section-badge">
                    {editingQuiz ? editQuizForm?.questions.length || 0 : quizForm.questions.length}
                  </span></h4>
                  <button type="button" className="btn-secondary" onClick={addQuizQuestion}>
                    + Add Question
                  </button>
                </div>
                
                {(editingQuiz ? editQuizForm?.questions || [] : quizForm.questions).map((q, qIndex) => (
                  <div key={qIndex} className="question-card">
                    <div className="question-header">
                      <h5>Question {qIndex + 1}</h5>
                      {(editingQuiz ? editQuizForm?.questions.length || 0 : quizForm.questions.length) > 1 && (
                        <button 
                          type="button" 
                          className="btn-danger"
                          onClick={() => removeQuizQuestion(qIndex)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label>Question Text *</label>
                      <input
                        className="form-control"
                        type="text"
                        value={q.question}
                        onChange={(e) => updateQuizQuestion(qIndex, 'question', e.target.value)}
                        placeholder="Enter the question"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Options (4 required) *</label>
                      {[0, 1, 2, 3].map((optIndex) => (
                        <div key={optIndex} className="option-row">
                          <input
                            className="option-input"
                            type="text"
                            value={q.options[optIndex] || ""}
                            onChange={(e) => {
                              const newOptions = [...q.options];
                              newOptions[optIndex] = e.target.value;
                              updateQuizQuestion(qIndex, 'options', newOptions);
                            }}
                            placeholder={`Option ${optIndex + 1}`}
                            required
                          />
                          <label className="radio-label">
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={q.answer === q.options[optIndex]}
                              onChange={() => updateQuizQuestion(qIndex, 'answer', q.options[optIndex])}
                            />
                            Correct Answer
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => {
                    setShowQuizForm(false);
                    setEditingQuiz(null);
                    setEditQuizForm(null);
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (editingQuiz ? "Updating..." : "Creating...") : (editingQuiz ? "Update Quiz" : "Create Quiz")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Notes Form Modal */}
      {showNotesForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>📚 Create Learning Notes</h3>
              <button className="close-btn" onClick={() => setShowNotesForm(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleCreateNotes}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Grade Level *</label>
                    <select
                      className="form-control"
                      value={notesForm.grade}
                      onChange={(e) => setNotesForm({...notesForm, grade: e.target.value})}
                      required
                    >
                      <option value="Grade 4">Grade 4</option>
                      <option value="Grade 5">Grade 5</option>
                      <option value="Grade 6">Grade 6</option>
                      <option value="Grade 7">Grade 7</option>
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Subject *</label>
                    <select
                      className="form-control"
                      value={notesForm.subject}
                      onChange={(e) => setNotesForm({...notesForm, subject: e.target.value})}
                      required
                    >
                      <option value="English">English</option>
                      <option value="Math">Math</option>
                      <option value="Science">Science</option>
                      <option value="History">History</option>
                      <option value="Geography">Geography</option>
                      <option value="Art">Art</option>
                      <option value="Life Skills">Life Skills</option>
                      <option value="Life Orientation">Life Orientation</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Topic Title *</label>
                  <input
                    className="form-control"
                    type="text"
                    value={notesForm.mainTopic}
                    onChange={(e) => setNotesForm({...notesForm, mainTopic: e.target.value})}
                    placeholder="e.g., Introduction to Fractions, Basic Grammar Rules"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    className="form-control textarea-control"
                    value={notesForm.description}
                    onChange={(e) => setNotesForm({...notesForm, description: e.target.value})}
                    placeholder="Brief description of what this learning material covers"
                    rows={3}
                    required
                  />
                </div>
                
                {/* Definitions Section */}
                <div className="section-header">
                  <h4>Key Terms & Definitions <span className="section-badge">{notesForm.definitions.length}</span></h4>
                  <button type="button" className="btn-secondary" onClick={addDefinition}>
                    + Add Term
                  </button>
                </div>
                
                {notesForm.definitions.map((def, dIndex) => (
                  <div key={dIndex} className="definition-row">
                    <input
                      className="form-control"
                      type="text"
                      value={def.word}
                      onChange={(e) => {
                        const newDefs = [...notesForm.definitions];
                        newDefs[dIndex].word = e.target.value;
                        setNotesForm({...notesForm, definitions: newDefs});
                      }}
                      placeholder="Term"
                    />
                    <input
                      className="form-control"
                      type="text"
                      value={def.meaning}
                      onChange={(e) => {
                        const newDefs = [...notesForm.definitions];
                        newDefs[dIndex].meaning = e.target.value;
                        setNotesForm({...notesForm, definitions: newDefs});
                      }}
                      placeholder="Definition"
                    />
                    <button 
                      type="button" 
                      className="btn-danger"
                      onClick={() => removeDefinition(dIndex)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                {/* Subtopics Section */}
                <div className="section-header">
                  <h4>Learning Subtopics <span className="section-badge">{notesForm.subTopics.length}</span></h4>
                  <button type="button" className="btn-secondary" onClick={addSubTopic}>
                    + Add Subtopic
                  </button>
                </div>
                
                {notesForm.subTopics.map((sub, sIndex) => (
                  <div key={sIndex} className="subtopic-card">
                    <div className="subtopic-header">
                      <h5>Subtopic {sIndex + 1}</h5>
                      <button 
                        type="button" 
                        className="btn-danger"
                        onClick={() => removeSubTopic(sIndex)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="form-group">
                      <label>Title</label>
                      <input
                        className="form-control"
                        type="text"
                        value={sub.title}
                        onChange={(e) => {
                          const newSubs = [...notesForm.subTopics];
                          newSubs[sIndex].title = e.target.value;
                          setNotesForm({...notesForm, subTopics: newSubs});
                        }}
                        placeholder="Subtopic title"
                      />
                    </div>
                    <div className="form-group">
                      <label>Content</label>
                      <textarea
                        className="form-control textarea-control"
                        value={sub.content}
                        onChange={(e) => {
                          const newSubs = [...notesForm.subTopics];
                          newSubs[sIndex].content = e.target.value;
                          setNotesForm({...notesForm, subTopics: newSubs});
                        }}
                        placeholder="Learning content for this subtopic"
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
                
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowNotesForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success" disabled={loading}>
                    {loading ? "Creating..." : "Create Learning Notes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Notes Modal */}
      {viewingNotes && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                <span>📚</span>
                {viewingNotes.mainTopic} - Learning Notes
              </h3>
              <button className="close-btn" onClick={() => setViewingNotes(null)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="notes-view">
                <div className="notes-header">
                  <h4>{viewingNotes.mainTopic}</h4>
                  <p className="notes-description">{viewingNotes.description}</p>
                  <div className="notes-meta">
                    <span>Grade: {viewingNotes.grade}</span>
                    <span>Subject: {viewingNotes.subject}</span>
                    <span>Created: {new Date(viewingNotes.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {viewingNotes.definitions && viewingNotes.definitions.length > 0 && (
                  <div className="notes-section">
                    <h5>📖 Key Terms & Definitions</h5>
                    <div className="definitions-list">
                      {viewingNotes.definitions.map((def, index) => (
                        <div key={index} className="definition-item">
                          <strong>{def.word}:</strong> {def.meaning}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {viewingNotes.subTopics && viewingNotes.subTopics.length > 0 && (
                  <div className="notes-section">
                    <h5>📚 Learning Subtopics</h5>
                    <div className="subtopics-list">
                      {viewingNotes.subTopics.map((sub, index) => (
                        <div key={index} className="subtopic-item">
                          <h6>{sub.title}</h6>
                          <p>{sub.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="modal-actions">
                  <button className="btn-primary" onClick={() => setViewingNotes(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Content Modal */}
      {previewContent && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                <span>👁️</span>
                Preview: {previewContent.mainTopic}
              </h3>
              <button className="close-btn" onClick={() => setPreviewContent(null)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="preview-content">
                <div className="preview-header">
                  <h4>{previewContent.mainTopic}</h4>
                  <p className="preview-description">{previewContent.description}</p>
                  <div className="preview-meta">
                    <span className="content-type-badge preview-badge">
                      {previewContent.contentType === 'quiz' ? '📝 Quiz' : '📚 Learning Notes'}
                    </span>
                    <span>Grade: {previewContent.grade}</span>
                    <span>Subject: {previewContent.subject}</span>
                  </div>
                </div>
                
                {previewContent.contentType === 'quiz' ? (
                  <div className="quiz-preview">
                    <h5>📝 Quiz Questions ({previewContent.questions?.length || 0})</h5>
                    {previewContent.questions?.map((q, index) => (
                      <div key={index} className="preview-question">
                        <p><strong>Q{index + 1}:</strong> {q.question}</p>
                        <div className="preview-options">
                          {q.options.map((option, optIndex) => (
                            <div key={optIndex} className={`preview-option ${option === q.answer ? 'correct-option' : ''}`}>
                              {option} {option === q.answer && '✅'}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="notes-preview">
                    {previewContent.definitions && previewContent.definitions.length > 0 && (
                      <div className="preview-section">
                        <h5>📖 Key Terms ({previewContent.definitions.length})</h5>
                        <ul>
                          {previewContent.definitions.map((def, index) => (
                            <li key={index}><strong>{def.word}:</strong> {def.meaning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {previewContent.subTopics && previewContent.subTopics.length > 0 && (
                      <div className="preview-section">
                        <h5>📚 Subtopics ({previewContent.subTopics.length})</h5>
                        {previewContent.subTopics.map((sub, index) => (
                          <div key={index} className="preview-subtopic">
                            <h6>{sub.title}</h6>
                            <p>{sub.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="modal-actions">
                  <button className="btn-primary" onClick={() => setPreviewContent(null)}>
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                <span>🔐</span>
                Change Your Password
              </h3>
              <button className="close-btn" onClick={() => {
                setShowChangePassword(false);
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
              }}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="password-change-form">
                <div className="form-group">
                  <label>Current Password *</label>
                  <input
                    className="form-control"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    placeholder="Enter your current password"
                    required
                    autoComplete="current-password"
                  />
                </div>
                
                <div className="form-group">
                  <label>New Password *</label>
                  <input
                    className="form-control"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    placeholder="Enter new password (min 6 characters)"
                    required
                    autoComplete="new-password"
                  />
                  <small className="password-hint">Must be at least 6 characters</small>
                </div>
                
                <div className="form-group">
                  <label>Confirm New Password *</label>
                  <input
                    className="form-control"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    placeholder="Confirm your new password"
                    required
                    autoComplete="new-password"
                  />
                </div>
                
                <div className="password-strength">
                  {passwordData.newPassword && (
                    <>
                      <div className="strength-meter">
                        <div 
                          className="strength-bar"
                          style={{
                            width: passwordData.newPassword.length >= 8 ? '100%' : 
                                   passwordData.newPassword.length >= 6 ? '66%' : '33%',
                            backgroundColor: passwordData.newPassword.length >= 8 ? '#10b981' : 
                                             passwordData.newPassword.length >= 6 ? '#f59e0b' : '#ef4444'
                          }}
                        ></div>
                      </div>
                      <div className="strength-text">
                        {passwordData.newPassword.length >= 8 ? 'Strong password ✓' : 
                         passwordData.newPassword.length >= 6 ? 'Medium strength' : 'Weak password'}
                      </div>
                    </>
                  )}
                </div>
                
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => {
                      setShowChangePassword(false);
                      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handlePasswordChange}
                    disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission Details Modal */}
      {selectedSubmission && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Submission Details</h3>
              <button className="close-btn" onClick={() => setSelectedSubmission(null)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="student-info-modal">
                <div className="student-avatar-large">
                  {selectedSubmission.studentId?.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <h4>{selectedSubmission.studentId?.name || 'Student'}</h4>
                  <p>{selectedSubmission.studentId?.email || ''} • {selectedSubmission.studentId?.grade || ''}</p>
                  <p>Score: {selectedSubmission.score}/{selectedSubmission.total}</p>
                </div>
              </div>

              <div className="answers-review">
                {selectedSubmission.answers.map((answer, index) => (
                  <div 
                    key={index}
                    className={`answer-item ${answer.correct ? 'correct' : 'incorrect'}`}
                  >
                    <p><strong>Q{index + 1}:</strong> {answer.question}</p>
                    <p><strong>Student's Answer:</strong> {answer.selected || "No answer"}</p>
                    <p><strong>Correct Answer:</strong> {answer.correctAnswer}</p>
                    <p className={`status ${answer.correct ? 'correct-text' : 'incorrect-text'}`}>
                      {answer.correct ? '✅ Correct' : '❌ Incorrect'}
                    </p>
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button className="btn-primary" onClick={() => setSelectedSubmission(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Review Modal */}
      {reviewingSubmission && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                <span>✏️</span>
                Manual Review & Correction
              </h3>
              <button className="close-btn" onClick={() => {
                setReviewingSubmission(null);
                setReviewError("");
                setReviewSuccess("");
              }}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="review-form">
                {/* Student Info */}
                <div className="student-info-modal">
                  <div className="student-avatar-large">
                    {reviewingSubmission.studentId?.name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h4>{reviewingSubmission.studentId?.name || 'Student'}</h4>
                    <p>{reviewingSubmission.contentId?.mainTopic || 'Quiz'}</p>
                    <p>Original Score: {reviewingSubmission.score}/{reviewingSubmission.total}</p>
                  </div>
                </div>

                {/* Review Error/Success Messages */}
                {reviewError && (
                  <div className="error-banner">
                    ❌ {reviewError}
                  </div>
                )}
                
                {reviewSuccess && (
                  <div className="success-banner">
                    ✅ {reviewSuccess}
                  </div>
                )}

                <div className="form-group">
                  <label>Updated Score (0-{reviewingSubmission.total}) *</label>
                  <input
                    className="form-control"
                    type="number"
                    value={manualScore}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value >= 0 && value <= reviewingSubmission.total) {
                        setManualScore(value);
                      }
                    }}
                    min="0"
                    max={reviewingSubmission.total}
                    required
                  />
                  <small className="password-hint">
                    Current score: {reviewingSubmission.score}/{reviewingSubmission.total}
                  </small>
                </div>

                <div className="form-group">
                  <label>Feedback for Student</label>
                  <textarea
                    className="form-control textarea-control"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    placeholder="Add comments, corrections, or encouragement for the student..."
                  />
                </div>

                <div className="modal-actions">
                  <button 
                    className="btn-secondary" 
                    onClick={() => {
                      setReviewingSubmission(null);
                      setReviewError("");
                      setReviewSuccess("");
                    }}
                    disabled={reviewLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={handleManualReview}
                    disabled={reviewLoading}
                  >
                    {reviewLoading ? (
                      <>
                        <span className="spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }}></span>
                        Submitting...
                      </>
                    ) : (
                      reviewingSubmission.isManuallyReviewed ? 'Update Review' : 'Submit Review'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}