import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  BookOpen, 
  Award, 
  Zap, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Leaf,
  Brain,
  Target,
  X,
  Sparkles,
  Trophy
} from "lucide-react";

const QuizModal = ({ quiz, onClose, onSubmit }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);

  const handleAnswer = (answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (answers.length !== quiz.questions.length) {
      toast.error("Please answer all questions");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/education/quiz/submit`,
        { quizId: quiz._id, answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResults(response.data);
      setShowResults(true);
      
      if (response.data.passed) {
        toast.success(`Quiz passed! +${response.data.pointsEarned} points`);
      } else {
        toast.error("Quiz failed. Try again!");
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to submit quiz");
    }
  };

  const handleClose = () => {
    if (showResults) {
      onSubmit();
    }
    onClose();
  };

  if (showResults && results) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
        <div className="glass-panel w-full max-w-2xl p-8 rounded-3xl border border-white/10 max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            {results.passed ? (
              <div className="mb-4">
                <Trophy className="w-20 h-20 mx-auto text-yellow-400 mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">Congratulations! 🎉</h2>
                <p className="text-emerald-400 text-xl">You passed with {results.score}%</p>
              </div>
            ) : (
              <div className="mb-4">
                <Target className="w-20 h-20 mx-auto text-red-400 mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">Keep Learning!</h2>
                <p className="text-red-400 text-xl">Score: {results.score}%</p>
              </div>
            )}
            
            <div className="flex justify-center gap-6 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{results.correctCount}/{results.totalQuestions}</p>
                <p className="text-xs text-gray-400">Correct</p>
              </div>
              {results.pointsEarned > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-400">+{results.pointsEarned}</p>
                  <p className="text-xs text-gray-400">Points</p>
                </div>
              )}
              {results.learningStreak > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-400">{results.learningStreak} 🔥</p>
                  <p className="text-xs text-gray-400">Day Streak</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-white text-lg mb-4">Review Answers:</h3>
            {results.results.map((result, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-xl border ${
                  result.isCorrect 
                    ? "bg-emerald-500/10 border-emerald-500/30" 
                    : "bg-red-500/10 border-red-500/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.isCorrect ? (
                    <CheckCircle className="text-emerald-400 flex-shrink-0 mt-1" size={20} />
                  ) : (
                    <X className="text-red-400 flex-shrink-0 mt-1" size={20} />
                  )}
                  <div className="flex-1">
                    <p className="text-white font-semibold mb-2">{index + 1}. {result.question}</p>
                    {result.explanation && (
                      <p className="text-sm text-gray-300 mt-2">💡 {result.explanation}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleClose}
            className="w-full mt-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
          >
            Continue Learning
          </button>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="glass-panel w-full max-w-2xl p-8 rounded-3xl border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{quiz.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">{question.question}</h3>
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  answers[currentQuestion] === index
                    ? "border-emerald-500 bg-emerald-500/20 text-white"
                    : "border-white/10 bg-white/5 text-gray-300 hover:border-emerald-500/50"
                }`}
              >
                <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span>
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="px-6 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {currentQuestion < quiz.questions.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={answers[currentQuestion] === undefined}
              className="flex-1 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={answers.length !== quiz.questions.length}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const EducationCard = ({ content, onStart, completed }) => {
  const difficultyColors = {
    beginner: "text-green-400 bg-green-500/20",
    intermediate: "text-yellow-400 bg-yellow-500/20",
    advanced: "text-red-400 bg-red-500/20"
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-emerald-500/30 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">{content.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-1 rounded-full ${difficultyColors[content.difficulty]}`}>
                {content.difficulty}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock size={12} /> {content.estimatedTime} min
              </span>
            </div>
          </div>
        </div>
        {completed && (
          <CheckCircle className="text-emerald-400" size={24} />
        )}
      </div>

      <p className="text-gray-300 text-sm mb-4 line-clamp-3">{content.content}</p>

      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-emerald-400">
            <Zap size={16} />
            <span className="text-sm font-bold">+{content.points} pts</span>
          </div>
          {completed && (
            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Goal achieved</p>
          )}
        </div>
        <div className="flex gap-2">
          {!completed ? (
            <button
              onClick={() => onStart(content)}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 hover:shadow-lg transition-all"
            >
              Start
            </button>
          ) : (
            <div className="flex items-center gap-2">
               <div className="px-3 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                 <CheckCircle size={16} />
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Education() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [impact, setImpact] = useState(null);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const [contentRes, impactRes, progressRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/education/content`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/education/impact`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/education/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setContents(contentRes.data);
      setImpact(impactRes.data);
      setProgress(progressRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load educational content");
    } finally {
      setLoading(false);
    }
  };

  const handleStartLearning = async (content) => {
    setSelectedContent(content);
  };

  const handleCompleteModule = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/education/content/${selectedContent._id}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Module completed! +${selectedContent.points} points`);
      setSelectedContent(null);
      fetchData();
      await axios.get(`${import.meta.env.VITE_API_URL}/api/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Error completing module:", error);
      toast.error(error.response?.data?.message || "Failed to complete module");
    }
  };

  const handleStartQuiz = async (topic) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/education/quiz/${topic}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCurrentQuiz(response.data);
      setShowQuiz(true);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      toast.error("Failed to load quiz");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen theme-bg flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 mx-auto mb-4 text-emerald-400 animate-pulse" />
          <p className="text-gray-400">Loading educational content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg theme-text p-4 pt-24 pb-24">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full mb-4">
            <Sparkles size={16} />
            <span className="text-sm font-bold">AI-Powered Learning</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Waste Management Hub
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Learn about proper waste disposal, earn rewards, and make a real environmental impact
          </p>
        </div>

        {impact && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="glass-panel p-6 rounded-2xl text-center">
              <Leaf className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
              <p className="text-3xl font-bold text-white">{impact.co2Saved}</p>
              <p className="text-xs text-gray-400 uppercase">kg CO₂ Saved</p>
            </div>
            <div className="glass-panel p-6 rounded-2xl text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
              <p className="text-3xl font-bold text-white">{impact.totalPoints}</p>
              <p className="text-xs text-gray-400 uppercase">Total Points</p>
            </div>
            <div className="glass-panel p-6 rounded-2xl text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-400" />
              <p className="text-3xl font-bold text-white">{impact.treesEquivalent}</p>
              <p className="text-xs text-gray-400 uppercase">Trees Planted</p>
            </div>
            <div className="glass-panel p-6 rounded-2xl text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-orange-400" />
              <p className="text-3xl font-bold text-white">{impact.learningStreak} 🔥</p>
              <p className="text-xs text-gray-400 uppercase">Day Streak</p>
            </div>
          </div>
        )}

        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen className="text-emerald-400" />
              Learning Modules
            </h2>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-white/5 rounded-lg text-xs text-gray-400 flex items-center gap-1">
                <CheckCircle size={12} className="text-emerald-400" /> {progress?.completedModules?.length || 0} Modules Done
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contents.length > 0 ? (
              contents.map((content) => (
                <EducationCard
                  key={content._id}
                  content={content}
                  onStart={handleStartLearning}
                  completed={content.completed}
                />
              ))
            ) : (
              <div className="col-span-full py-12 text-center glass-panel rounded-3xl">
                <p className="text-gray-500">No educational modules found. Please try refreshing.</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel p-8 rounded-3xl mb-12 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-blue-500/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-500/20 rounded-2xl">
                <Brain className="w-12 h-12 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Weekly Challenge</h2>
                <p className="text-gray-300">Test your mastery with a random waste management quiz!</p>
              </div>
            </div>
            <button
              onClick={() => {
                const topics = ["battery-disposal", "plastic-recycling", "organic-waste", "environmental-impact", "sorting-techniques"];
                const randomTopic = topics[Math.floor(Math.random() * topics.length)];
                handleStartQuiz(randomTopic);
              }}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 transition-all"
            >
              Start Random Quiz
            </button>
          </div>
        </div>

        {selectedContent && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
            <div className="glass-panel w-full max-w-3xl p-8 rounded-3xl border border-white/10 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-bold text-white">{selectedContent.title}</h2>
                <button onClick={() => setSelectedContent(null)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="prose prose-invert max-w-none mb-6">
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">{selectedContent.content}</p>
              </div>

              {selectedContent.tips && selectedContent.tips.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-4">💡 Key Tips:</h3>
                  <ul className="space-y-2">
                    {selectedContent.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-3 text-gray-300">
                        <CheckCircle className="text-emerald-400 flex-shrink-0 mt-1" size={16} />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedContent(null)}
                  className="flex-1 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10"
                >
                  Close
                </button>
                <button
                  onClick={handleCompleteModule}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:shadow-lg"
                >
                  Complete Module (+{selectedContent.points} points)
                </button>
              </div>
            </div>
          </div>
        )}

        {showQuiz && currentQuiz && (
          <QuizModal
            quiz={currentQuiz}
            onClose={() => {
              setShowQuiz(false);
              setCurrentQuiz(null);
            }}
            onSubmit={fetchData}
          />
        )}

      </div>
    </div>
  );
}
