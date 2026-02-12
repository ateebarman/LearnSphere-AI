import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateQuiz, submitQuiz } from '../services/quizService';
import { FaSpinner, FaArrowLeft, FaArrowRight, FaCheckCircle, FaTrophy, FaLightbulb, FaClipboardList } from 'react-icons/fa';

const QuizPage = () => {
  const { roadmapId, moduleTitle } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});

  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      try {
        const data = await generateQuiz(moduleTitle, "related topic");
        setQuestions(data.questions);
        setSelectedAnswers(new Array(data.questions.length).fill(null));
      } catch (err) {
        setError('Failed to generate quiz.');
      }
      setLoading(false);
    };
    fetchQuiz();
  }, [moduleTitle]);

  const handleAnswerSelect = (option) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = option;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const answersList = questions.map((q, idx) => selectedAnswers[idx]);
      const data = await submitQuiz(roadmapId, moduleTitle, answersList, questions);
      setResults(data);
    } catch (err) {
      setError('Failed to submit quiz.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-indigo-100 dark:border-indigo-900 rounded-full animate-ping opacity-20"></div>
          <FaSpinner className="text-5xl text-indigo-600 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-xl font-black dark:text-white">Generating Your Assessment...</p>
          <p className="text-gray-500 font-medium whitespace-nowrap">AI is crafting custom questions based on your roadmap.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-premium max-w-lg mx-auto py-12 text-center border-red-100 dark:border-red-900/40">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">!</div>
        <p className="text-red-600 dark:text-red-400 font-black text-xl mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-secondary">Try Again</button>
      </div>
    );
  }

  if (results) {
    const isSuccess = results.score >= 70;
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in zoom-in duration-500">
        <div className="card-premium p-12 text-center space-y-8 relative overflow-hidden">
          {isSuccess && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-green-500/10 rounded-full blur-3xl -mt-20"></div>}

          <div className="space-y-4">
            <h2 className="text-4xl font-black dark:text-white">Assessment Complete!</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Results for: <span className="text-indigo-600">{moduleTitle}</span></p>
          </div>

          <div className="relative inline-block">
            <div className={`text-8xl font-black bg-gradient-to-br ${isSuccess ? 'from-green-500 to-emerald-600' : 'from-orange-500 to-red-600'} bg-clip-text text-transparent px-8 py-4`}>
              {results.score.toFixed(0)}%
            </div>
            {isSuccess && <FaTrophy className="absolute -top-4 -right-4 text-4xl text-yellow-500 animate-bounce" />}
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 p-8 rounded-3xl space-y-4 text-left">
            <h4 className="font-black text-xs uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <FaLightbulb /> AI Personal Feedback
            </h4>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
              {results.feedback || "Great job completing the assessment! Keep up the consistent learning to master this module."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              onClick={() => navigate(`/roadmap/${roadmapId}`)}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <FaArrowLeft /> Retun to Learning Path
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary flex-1"
            >
              Retake Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header & Progress */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-4xl font-extrabold text-gradient flex items-center gap-3">
              <FaClipboardList className="text-indigo-600" />
              Assessment
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">{moduleTitle}</p>
          </div>
          <div className="px-6 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-2xl font-black text-sm border border-indigo-100 dark:border-indigo-800">
            Question {currentQuestion + 1} of {questions.length}
          </div>
        </div>

        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 relative overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-500 shadow-lg shadow-indigo-500/30"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="card-premium p-10 space-y-10 min-h-[400px] flex flex-col justify-between">
        <div className="space-y-8">
          <h3 className="text-2xl font-black dark:text-white leading-tight">
            {q.question}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {q.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                className={`group text-left p-6 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 ${selectedAnswers[currentQuestion] === option
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20'
                  : 'bg-gray-50 dark:bg-gray-900 border-transparent dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 font-black text-xs transition-colors ${selectedAnswers[currentQuestion] === option
                  ? 'bg-white text-indigo-600 border-white'
                  : 'border-slate-200 dark:border-slate-700'
                  }`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="font-bold flex-grow">{option}</span>
                {selectedAnswers[currentQuestion] === option && <FaCheckCircle className="text-white text-lg" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-10 border-t dark:border-gray-800">
          <button
            onClick={handlePrev}
            disabled={currentQuestion === 0}
            className="btn-secondary py-3 px-8 flex items-center gap-2 group disabled:opacity-30"
          >
            <FaArrowLeft className="transition-transform group-hover:-translate-x-1" />
            Previous
          </button>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedAnswers[currentQuestion]}
              className="btn-primary py-3 px-12 group flex items-center gap-2 disabled:bg-gray-400"
            >
              {submitting ? (
                <> <FaSpinner className="animate-spin" /> Analyzing... </>
              ) : (
                <> <FaCheckCircle /> Submit Assessment </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!selectedAnswers[currentQuestion]}
              className="btn-primary py-3 px-10 flex items-center gap-2 group disabled:bg-gray-400"
            >
              Next Question
              <FaArrowRight className="transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-2">
        {questions.map((_, idx) => (
          <div
            key={idx}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${currentQuestion === idx ? 'w-8 bg-indigo-600' : 'bg-gray-300 dark:bg-gray-800'
              }`}
          />
        ))}
      </div>
    </div>
  );
};

export default QuizPage;