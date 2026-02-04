import { useEffect, useState } from "react";

type Props = {
  selectedGrade: string;
};

type Question = {
  question: string;
  options: string[];
  answer: string;
};

type ReviewItem = {
  question: string;
  selected: string;
  correctAnswer: string;
  correct: boolean;
};

export default function ReadingEngine({ selectedGrade }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [review, setReview] = useState<ReviewItem[]>([]);
  const [score, setScore] = useState(0);

  // Load questions + previous attempt
  useEffect(() => {
    // Demo questions (replace with backend later)
    const quizQuestions: Question[] = [
      {
        question: "Why should you wash your hands?",
        options: ["To stay healthy", "To look cool", "To sleep", "No reason"],
        answer: "To stay healthy",
      },
      {
        question: "How often should you brush your teeth?",
        options: ["Once a week", "Twice a day", "Never", "Once a month"],
        answer: "Twice a day",
      },
    ];

    setQuestions(quizQuestions);

    // Load previous review if exists
    const saved = localStorage.getItem(`quiz_${selectedGrade}`);
    if (saved) {
      const data = JSON.parse(saved);
      setReview(data.review);
      setScore(data.score);
      setSubmitted(true);
    }
  }, [selectedGrade]);

  const selectAnswer = (index: number, option: string) => {
    const updated = [...answers];
    updated[index] = option;
    setAnswers(updated);
  };

  const submitQuiz = () => {
    let total = 0;

    const result: ReviewItem[] = questions.map((q, i) => {
      const correct = answers[i] === q.answer;
      if (correct) total++;

      return {
        question: q.question,
        selected: answers[i] || "No answer",
        correctAnswer: q.answer,
        correct,
      };
    });

    setScore(total);
    setReview(result);
    setSubmitted(true);

    localStorage.setItem(
      `quiz_${selectedGrade}`,
      JSON.stringify({
        score: total,
        review: result,
      })
    );
  };

  const resetQuiz = () => {
    localStorage.removeItem(`quiz_${selectedGrade}`);
    setAnswers([]);
    setReview([]);
    setScore(0);
    setSubmitted(false);
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>{selectedGrade} Quiz</h2>

      {!submitted &&
        questions.map((q, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              padding: 20,
              marginBottom: 20,
              borderRadius: 12,
            }}
          >
            <strong>{q.question}</strong>

            {q.options.map((o) => (
              <div key={o}>
                <label>
                  <input
                    type="radio"
                    name={`q-${i}`}
                    onChange={() => selectAnswer(i, o)}
                  />{" "}
                  {o}
                </label>
              </div>
            ))}
          </div>
        ))}

      {!submitted && (
        <button className="start-learning-btn" onClick={submitQuiz}>
          Submit Quiz
        </button>
      )}

      {submitted && (
        <>
          <div
            style={{
              background: "#fff",
              padding: 25,
              borderRadius: 15,
              marginBottom: 30,
              textAlign: "center",
            }}
          >
            <h2>
              📊 Score: {score} / {questions.length}
            </h2>
          </div>

          {review.map((r, i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                padding: 20,
                marginBottom: 20,
                borderRadius: 12,
              }}
            >
              <strong>{r.question}</strong>
              <p>Your answer: {r.selected}</p>

              {r.correct ? (
                <p style={{ color: "green", fontWeight: "bold" }}>
                  ✅ Correct
                </p>
              ) : (
                <p style={{ color: "red", fontWeight: "bold" }}>
                  ❌ Wrong <br />
                  Correct answer: {r.correctAnswer}
                </p>
              )}
            </div>
          ))}

          <button className="back-btn" onClick={resetQuiz}>
            🔄 Retake Quiz
          </button>
        </>
      )}
    </div>
  );
}
