import { useEffect, useState } from "react";
import "../../styles/StudentDashboard.css";

type User = {
  id: string;
  name: string;
  email: string;
  grade: string;
  maxAttempts: number;
  attemptsUsed: number;
};

type Content = {
  _id: string;
  mainTopic: string;
  subject: string;
  description: string;
  contentType?: 'quiz' | 'notes';
  questions: Array<{
    question: string;
    options: string[];
    answer: string;
  }>;
  definitions?: Array<{ word: string; meaning: string }>;
  subTopics?: Array<{ title: string; content: string }>;
  grade?: string;
};

type Submission = {
  _id: string;
  contentId: Content;
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

export default function StudentDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [content, setContent] = useState<Content[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    averageScore: 0,
    totalQuizzes: 0,
    completedQuizzes: 0
  });

  useEffect(() => {
    loadContent();
    loadSubmissions();
  }, []);

  useEffect(() => {
    if (submissions.length > 0 && content.length > 0) {
      // Calculate average percentage score
      let totalPercentage = 0;
      submissions.forEach(sub => {
        const percentage = (sub.score / sub.total) * 100;
        totalPercentage += percentage;
      });
      const averageScore = submissions.length > 0 ? Math.round(totalPercentage / submissions.length) : 0;
      
      const uniqueCompleted = new Set(submissions.map(s => s.contentId?._id)).size;
      
      setStats({
        averageScore,
        totalQuizzes: content.length,
        completedQuizzes: uniqueCompleted
      });
    } else {
      setStats({
        averageScore: 0,
        totalQuizzes: content.length,
        completedQuizzes: 0
      });
    }
  }, [submissions, content]);

  const loadContent = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/content?grade=${user.grade}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setContent(data);
    } catch (err) {
      setError("Failed to load content");
    }
  };

  const loadSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/submissions/student/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSubmissions(data);
    } catch (err) {
      console.error("Failed to load submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (contentItem: Content) => {
    const attempts = submissions.filter(s => s.contentId?._id === contentItem._id).length;
    if (attempts >= user.maxAttempts) {
      alert(`📊 Maximum attempts (${user.maxAttempts}) reached for this quiz.`);
      return;
    }
    
    setSelectedContent(contentItem);
    setAnswers(new Array(contentItem.questions.length).fill(""));
    setShowQuiz(true);
    setShowReview(false);
    setShowNotes(false);
    setSelectedSubmission(null);
  };

  const viewNotes = (contentItem: Content) => {
    setSelectedContent(contentItem);
    setShowNotes(true);
    setShowQuiz(false);
    setShowReview(false);
    setSelectedSubmission(null);
    setAnswers([]);
  };

  const submitQuiz = async () => {
    if (!selectedContent) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch("http://localhost:4000/api/submissions/submit-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contentId: selectedContent._id,
          answers
        }),
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        alert(`🎉 Quiz Submitted Successfully!\n\n📊 Score: ${data.score}/${data.total}\n📈 Attempts Left: ${data.attemptsLeft}`);
        loadSubmissions();
        setShowQuiz(false);
        setSelectedSubmission({
          _id: 'new',
          contentId: selectedContent,
          score: data.score,
          total: data.total,
          answers: data.review,
          submittedAt: new Date().toISOString(),
          isManuallyReviewed: false,
          adminFeedback: ''
        });
        setShowReview(true);
      } else {
        alert(`❌ ${data.message || "Submission failed. Please try again."}`);
      }
    } catch (err) {
      console.error("Submit quiz error:", err);
      alert("⚠️ Network error. Please check your connection and try again.");
    }
  };

  const viewReview = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowReview(true);
    setShowQuiz(false);
    setShowNotes(false);
    setSelectedContent(null);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <h3>Loading your dashboard...</h3>
          <p>Please wait while we prepare your learning materials</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="user-info">
          <div className="user-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <h2>Welcome back, {user.name}! 👋</h2>
            <p>
              <span>📚 {user.grade}</span>
              <span>•</span>
              <span>🔄 {user.attemptsUsed}/{user.maxAttempts} Attempts Used</span>
              {stats.averageScore > 0 && (
                <>
                  <span>•</span>
                  <span>📊 Avg: {stats.averageScore}%</span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button className="logout-btn" onClick={onLogout}>
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {error && <div className="error-banner">❌ {error}</div>}

        {/* Quick Stats */}
        <div className="content-section">
          <div className="content-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div className="progress-card">
              <div className="decorative-circle decorative-circle-1"></div>
              <div className="decorative-circle decorative-circle-2"></div>
              
              <h3 className="progress-title">
                <span className="icon-container">
                  📊
                </span>
                Your Progress
              </h3>
              <p className="progress-subtitle">
                Track your learning journey
              </p>
              
              <div className="stats-container">
                <div className="stats-box">
                  <div className="stats-number">
                    <span className="emoji-badge" style={{ background: 'rgba(34, 197, 94, 0.2)' }}>
                      ✅
                    </span>
                    {stats.completedQuizzes}/{content.length}
                  </div>
                  <div className="stats-label">
                    Quizzes Completed
                  </div>
                </div>
                
                <div className="stats-box">
                  <div className="stats-number" style={{ 
                    color: stats.averageScore >= 70 ? '#10b981' : stats.averageScore >= 50 ? '#f59e0b' : '#ef4444'
                  }}>
                    <span className="emoji-badge" style={{ 
                      background: stats.averageScore >= 70 ? 'rgba(16, 185, 129, 0.2)' : 
                                stats.averageScore >= 50 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                    }}>
                      📈
                    </span>
                    {stats.averageScore}%
                  </div>
                  <div className="stats-label">
                    Average Score
                  </div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="progress-container">
                <div className="progress-info">
                  <span className="progress-label">
                    Overall Progress
                  </span>
                  <span className="progress-percentage">
                    {content.length > 0 ? Math.round((stats.completedQuizzes / content.length) * 100) : 0}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${content.length > 0 ? (stats.completedQuizzes / content.length) * 100 : 0}%`,
                      background: 'linear-gradient(90deg, #4f46e5, #7c3aed)'
                    }}
                  ></div>
                </div>
                <div className="progress-range">
                  <span>Started</span>
                  <span>Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="content-section">
          <h3>
            <span>📚</span>
            Available Learning Materials
            {content.length > 0 && (
              <span className="achievement-badge">{content.length} Available</span>
            )}
          </h3>
          
          {content.length === 0 ? (
            <div className="empty-state">
              <h3>📭 No Content Available Yet</h3>
              <p>Your teacher will add quizzes and learning materials soon. Check back later!</p>
            </div>
          ) : (
            <div className="content-grid">
              {content.map((item) => {
                const attempts = submissions.filter(s => s.contentId?._id === item._id).length;
                const attemptsLeft = user.maxAttempts - attempts;
                const bestScore = submissions
                  .filter(s => s.contentId?._id === item._id)
                  .reduce((max, sub) => Math.max(max, sub.score), 0);
                
                return (
                  <div key={item._id} className="content-card">
                    <span className="card-badge">{item.subject}</span>
                    <h4 className="card-title">{item.mainTopic}</h4>
                    <p className="card-description">{item.description}</p>
                    
                    <div className="card-stats">
                      {item.contentType === 'notes' ? (
                        <>
                          <span className="notes-stats-item">📖 {item.subTopics?.length || 0} Sections</span>
                          <span className="notes-stats-item">📚 {item.definitions?.length || 0} Terms</span>
                          <span className="notes-stats-item">📝 Learning Material</span>
                        </>
                      ) : (
                        <>
                          <span>📝 {item.questions?.length || 0} Questions</span>
                          <span>🔄 {attemptsLeft} Attempts Left</span>
                          {bestScore > 0 && <span>🏆 Best: {bestScore}/{item.questions?.length || 0}</span>}
                        </>
                      )}
                    </div>
                    
                    <div className="card-actions">
                      {item.contentType === 'notes' ? (
                        <button 
                          className="primary-btn" 
                          onClick={() => viewNotes(item)}
                        >
                          <span>📚</span>
                          <span>View Notes</span>
                        </button>
                      ) : (
                        <button 
                          className="primary-btn" 
                          onClick={() => startQuiz(item)}
                          disabled={attemptsLeft <= 0}
                        >
                          {attemptsLeft <= 0 ? (
                            <>
                              <span>❌</span>
                              <span>No Attempts Left</span>
                            </>
                          ) : (
                            <>
                              <span>▶️</span>
                              <span>Start Quiz</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submissions History */}
        <div className="submissions-section">
          <h3>
            <span>📋</span>
            Your Quiz History
            {submissions.length > 0 && (
              <span className="achievement-badge">{submissions.length} Submissions</span>
            )}
          </h3>
          
          {submissions.length === 0 ? (
            <div className="empty-state">
              <h3>📊 No Submissions Yet</h3>
              <p>Complete your first quiz to see your progress and scores here.</p>
              {content.length > 0 && (
                <button 
                  className="primary-btn" 
                  style={{ marginTop: '20px', padding: '14px 28px' }}
                  onClick={() => {
                    const firstQuiz = content.find(item => item.contentType !== 'notes');
                    if (firstQuiz) startQuiz(firstQuiz);
                  }}
                >
                  🚀 Start Your First Quiz
                </button>
              )}
            </div>
          ) : (
            <div className="submissions-list">
              {submissions.map((sub) => {
                const percentage = (sub.score / sub.total) * 100;
                const date = new Date(sub.submittedAt);
                
                return (
                  <div key={sub._id} className="submission-card">
                    <div className="submission-header">
                      <span className="topic">
                        <span style={{ marginRight: '10px' }}>📝</span>
                        {sub.contentId?.mainTopic}
                      </span>
                      <span className={`score ${percentage >= 70 ? 'good' : 'bad'}`}>
                        {sub.score}/{sub.total} ({Math.round(percentage)}%)
                      </span>
                    </div>
                    
                    <div className="submission-details">
                      <span>
                        <span>📅</span>
                        <span>{date.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</span>
                      </span>
                      <span>
                        <span>⏰</span>
                        <span>{date.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                      </span>
                      {sub.isManuallyReviewed && (
                        <span className="teacher-reviewed">
                          <span>👨‍🏫</span>
                          <span>Teacher Reviewed</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    
                    <button 
                      className="review-btn" 
                      onClick={() => viewReview(sub)}
                    >
                      <span>📊</span>
                      <span>View Detailed Review</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quiz Modal */}
      {showQuiz && selectedContent && (
        <div className="quiz-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <span>📝</span>
                {selectedContent.mainTopic}
              </h3>
              <button className="close-btn" onClick={() => setShowQuiz(false)}>✕</button>
            </div>
            
            <div className="quiz-questions">
              {selectedContent.questions.map((q, qIndex) => (
                <div key={qIndex} className="quiz-question">
                  <h4>
                    <div className="question-number">
                      {qIndex + 1}
                    </div>
                    {q.question}
                  </h4>
                  <div className="quiz-options">
                    {q.options.map((option, oIndex) => (
                      <div 
                        key={oIndex}
                        className={`quiz-option ${answers[qIndex] === option ? 'selected' : ''}`}
                        onClick={() => {
                          const newAnswers = [...answers];
                          newAnswers[qIndex] = option;
                          setAnswers(newAnswers);
                        }}
                      >
                        <input
                          type="radio"
                          name={`q-${qIndex}`}
                          checked={answers[qIndex] === option}
                          onChange={() => {}}
                        />
                        <span>{option}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button 
                className="secondary-btn" 
                onClick={() => setShowQuiz(false)}
                style={{ padding: '12px 24px' }}
              >
                <span>←</span>
                <span>Cancel Quiz</span>
              </button>
              <button 
                className="primary-btn" 
                onClick={submitQuiz}
                disabled={answers.filter(a => a).length !== selectedContent.questions.length}
                style={{ 
                  minWidth: '200px',
                  padding: '12px 24px'
                }}
              >
                <span>📤</span>
                <span>
                  Submit Quiz ({answers.filter(a => a).length}/{selectedContent.questions.length})
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReview && selectedSubmission && (
        <div className="quiz-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <span>📊</span>
                Quiz Review: {selectedSubmission.contentId?.mainTopic}
              </h3>
              <button className="close-btn" onClick={() => setShowReview(false)}>✕</button>
            </div>

            <div className="score-display">
              <h2>
                {selectedSubmission.score >= selectedSubmission.total * 0.7 ? '🎉 Excellent Work!' : '📚 Keep Learning!'}
              </h2>
              <h1>
                {selectedSubmission.score}/{selectedSubmission.total}
              </h1>
              <p>
                {Math.round((selectedSubmission.score / selectedSubmission.total) * 100)}% Score
              </p>
              
              {selectedSubmission.isManuallyReviewed && selectedSubmission.adminFeedback && (
                <div className="admin-feedback">
                  <strong>💬 Teacher's Feedback:</strong>
                  <p style={{ marginTop: '8px' }}>{selectedSubmission.adminFeedback}</p>
                </div>
              )}
            </div>

            <div className="review-questions">
              {selectedSubmission.answers.map((answer, index) => (
                <div 
                  key={index}
                  className={`review-item ${answer.correct ? 'correct' : 'incorrect'}`}
                >
                  <h4>
                    <div 
                      className="question-number"
                      style={{ 
                        background: answer.correct ? '#10b981' : '#ef4444'
                      }}
                    >
                      {index + 1}
                    </div>
                    {answer.question}
                  </h4>
                  <p><strong>Your Answer:</strong> {answer.selected || "No answer provided"}</p>
                  <p><strong>Correct Answer:</strong> {answer.correctAnswer}</p>
                  <div className="result-icon">
                    {answer.correct ? '✅ Correct Answer' : '❌ Incorrect Answer'}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button 
                className="primary-btn" 
                onClick={() => setShowReview(false)}
                style={{ 
                  minWidth: '200px',
                  padding: '12px 24px'
                }}
              >
                <span>←</span>
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes View Modal */}
      {showNotes && selectedContent && (
        <div className="quiz-modal notes-modal">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon">📚</span>
                <div>
                  <h3>{selectedContent.mainTopic} - Learning Notes</h3>
                  <p className="modal-subtitle">{selectedContent.subject} • Grade {selectedContent.grade || user.grade}</p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setShowNotes(false)}>✕</button>
            </div>

            <div className="modal-body notes-view">
              {/* Description section */}
              <div className="notes-description-section">
                <h4>📌 Overview</h4>
                <p>{selectedContent.description}</p>
              </div>

              {/* Key Terms Section - Only show if definitions exist */}
              {selectedContent.definitions && selectedContent.definitions.length > 0 && (
                <div className="notes-section key-terms-section">
                  <div className="section-header">
                    <h5>
                      <span className="section-icon">📖</span>
                      Key Terms & Definitions
                      <span className="badge">{selectedContent.definitions.length}</span>
                    </h5>
                  </div>
                  <div className="definitions-grid">
                    {selectedContent.definitions.map((def, index) => (
                      <div key={index} className="definition-card">
                        <div className="definition-header">
                          <span className="term-index">#{index + 1}</span>
                          <span className="term-word">{def.word}</span>
                        </div>
                        <div className="definition-content">
                          <p>{def.meaning}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning Content Section - Only show if subtopics exist */}
              {selectedContent.subTopics && selectedContent.subTopics.length > 0 && (
                <div className="notes-section learning-content-section">
                  <div className="section-header">
                    <h5>
                      <span className="section-icon">📚</span>
                      Learning Content
                      <span className="badge">{selectedContent.subTopics.length} sections</span>
                    </h5>
                  </div>
                  <div className="subtopics-container">
                    {selectedContent.subTopics.map((sub, index) => (
                      <div key={index} className="subtopic-card">
                        <div className="subtopic-header">
                          <div className="subtopic-number">Section {index + 1}</div>
                          <h6>{sub.title}</h6>
                        </div>
                        <div className="subtopic-content">
                          <p>{sub.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state if no content */}
              {(!selectedContent.definitions || selectedContent.definitions.length === 0) &&
               (!selectedContent.subTopics || selectedContent.subTopics.length === 0) && (
                <div className="empty-notes-state">
                  <div className="empty-icon">📄</div>
                  <h4>No detailed content available</h4>
                  <p>This notes section contains only the topic overview.</p>
                </div>
              )}

              {/* Footer */}
              <div className="modal-footer">
                <button 
                  className="secondary-btn"
                  onClick={() => {
                    // Option to print/download notes
                    window.print();
                  }}
                >
                  <span>🖨️</span>
                  <span>Print Notes</span>
                </button>
                <button 
                  className="primary-btn" 
                  onClick={() => setShowNotes(false)}
                >
                  <span>←</span>
                  <span>Back to Dashboard</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      {content.length > 0 && !showQuiz && !showReview && !showNotes && (
        <button 
          className="floating-btn"
          onClick={() => {
            const firstAvailable = content.find(item => {
              if (item.contentType === 'notes') return true;
              const attempts = submissions.filter(s => s.contentId?._id === item._id).length;
              return attempts < user.maxAttempts;
            });
            if (firstAvailable) {
              if (firstAvailable.contentType === 'notes') {
                viewNotes(firstAvailable);
              } else {
                startQuiz(firstAvailable);
              }
            } else {
              alert('🎯 You have completed all available quizzes! Check out the learning notes.');
            }
          }}
          title="Start Learning"
        >
          📚
        </button>
      )}
    </div>
  );
}