import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateQuiz, submitQuiz } from '../services/quizService';
import { FaSpinner } from 'react-icons/fa';

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
        const data = await generateQuiz(moduleTitle, "related topic"); // Pass a broader topic if available
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
    return <div className="text-center"><FaSpinner className="animate-spin text-4xl mx-auto mt-20" /></div>;
  }
  if (error) {
    return <div className="text-red-500 bg-red-100 p-4 rounded">{error}</div>;
  }
  if (results) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center mb-4">Quiz Results</h2>
        <h3 className={`text-5xl font-bold text-center mb-6 ${results.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
          {results.score.toFixed(1)}%
        </h3>
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <h4 className="font-semibold text-lg mb-2">AI Feedback:</h4>
          <p>{results.feedback}</p>
        </div>
        <button
          onClick={() => navigate(`/roadmap/${roadmapId}`)}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
        >
          Back to Roadmap
        </button>
      </div>
    );
  }

  const q = questions[currentQuestion];
  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-2">Quiz: {moduleTitle}</h2>
      <p className="text-gray-600 mb-6">Question {currentQuestion + 1} of {questions.length}</p>
      
      <h3 className="text-xl font-semibold mb-4">{q.question}</h3>
      
      <div className="space-y-3">
        {q.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswerSelect(option)}
            className={`w-full text-left p-4 rounded-lg border-2 ${
              selectedAnswers[currentQuestion] === option
                ? 'bg-indigo-100 border-indigo-600'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      
      <div className="flex justify-between mt-8">
        <button onClick={handlePrev} disabled={currentQuestion === 0} className="bg-gray-300 px-6 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50">
          Previous
        </button>
        
        {currentQuestion === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-green-300"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        ) : (
          <button onClick={handleNext} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizPage;