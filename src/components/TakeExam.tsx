import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DPAConsentModal from './DPAConsentModal';
import { Wifi, WifiOff, Save, CheckCircle, Clock, Check, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';

export default function TakeExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showConsent, setShowConsent] = useState(true);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Resiliency states
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [offlineUnsaved, setOfflineUnsaved] = useState(false);

  const [finished, setFinished] = useState(false);
  const [scoreData, setScoreData] = useState<any>(null);

  // Poll online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch Exam Data
  useEffect(() => {
    fetch(`/api/exams/${examId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setExam(data);
        setLoading(false);
        // Load offline cached answers specifically for this exam if they exist
        const cached = localStorage.getItem(`makitest_answers_${examId}`);
        if (cached) {
          setAnswers(JSON.parse(cached));
          setOfflineUnsaved(true);
        }
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [examId]);

  // Heartbeat Sync
  useEffect(() => {
    if (!attemptId || !isOnline) return;

    const syncInterval = setInterval(async () => {
      if (Object.keys(answers).length === 0) return;
      
      setSyncing(true);
      try {
        const res = await fetch(`/api/attempts/${attemptId}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers })
        });
        
        if (res.ok) {
          setLastSynced(new Date());
          setOfflineUnsaved(false);
          // clear cache partially or leave it till submit
        }
      } catch (err) {
        console.error('Heartbeat sync failed:', err);
      } finally {
        setSyncing(false);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(syncInterval);
  }, [attemptId, answers, isOnline]);

  const handleStart = async (studentName: string) => {
    try {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam_id: examId, consent_given: true, student_name: studentName })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setAttemptId(data.attemptId);
      setShowConsent(false);
    } catch (err: any) {
      alert('Failed to start session: ' + err.message);
    }
  };

  const handleDecline = () => {
    navigate('/');
  };

  const selectOption = (qId: number, option: string) => {
    const newAnswers = { ...answers, [qId]: option };
    setAnswers(newAnswers);
    setOfflineUnsaved(true);
    // Instant save to localStorage for extreme resiliency
    localStorage.setItem(`makitest_answers_${examId}`, JSON.stringify(newAnswers));
  };

  const submitExam = async () => {
    if (!window.confirm("Are you sure you want to finish the exam?")) return;

    if (!isOnline) {
      alert("You are offline. Your answers are saved locally. Please connect to the internet to submit.");
      return;
    }

    try {
      const res = await fetch(`/api/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setFinished(true);
      setScoreData(data);
      localStorage.removeItem(`makitest_answers_${examId}`);
    } catch (err: any) {
      alert('Submit failed: ' + err.message);
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500 font-medium">Loading Exam Data...</div>;
  if (error || !exam) return <div className="p-12 text-center text-red-600 font-medium">{error || 'Exam not found'}</div>;

  if (showConsent) {
    return <DPAConsentModal onAccept={handleStart} onDecline={handleDecline} />;
  }

  if (finished && scoreData) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white p-8 sm:p-12 border border-gray-200 rounded-2xl shadow-sm text-center">
        <div className="bg-green-100 p-4 rounded-full inline-block mb-6">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Exam Submitted</h2>
        <p className="text-gray-500 mb-8 font-medium">Your attempt has been recorded securely.</p>
        
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8 inline-flex items-center gap-6">
          <div className="text-center">
            <span className="block text-4xl font-black text-gray-900">{scoreData.score}</span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Score</span>
          </div>
          <div className="w-px h-12 bg-gray-300"></div>
          <div className="text-center">
            <span className="block text-4xl font-black text-gray-900">{exam.questions.length}</span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Total items</span>
          </div>
        </div>

        <div>
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-red-800 text-white rounded-lg font-bold hover:bg-red-900 transition-colors shadow-sm"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQ = exam.questions[currentQuestionIndex];
  const allAnswered = Object.keys(answers).length === exam.questions.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Resiliency Top Bar / HUD */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-4 justify-between items-center shadow-sm sticky top-20 z-40">
        <div>
          <h2 className="font-bold text-gray-900 text-lg leading-tight">{exam.title}</h2>
          <p className="text-sm font-medium text-gray-500">
            Question {currentQuestionIndex + 1} of {exam.questions.length}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full ${isOnline ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span>{isOnline ? 'Connected' : 'Offline'}</span>
          </div>
          
          <div className="flex items-center space-x-1.5 text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
            {syncing ? (
              <Save className="w-4 h-4 animate-pulse opacity-70" />
            ) : offlineUnsaved && !isOnline ? (
               <AlertTriangle className="w-4 h-4 text-amber-500" />
            ) : (
              <Check className="w-4 h-4 text-green-600" />
            )}
            <span>
              {syncing ? 'Syncing...' : 
               offlineUnsaved && !isOnline ? 'Locally Saved' : 
               lastSynced ? `Saved ${lastSynced.toLocaleTimeString()}` : 'Saved'}
            </span>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-10 mb-20">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-snug mb-8">
          {currentQ.question_text}
        </h3>

        <div className="space-y-3">
          {currentQ.options.map((option: string, idx: number) => {
            const isSelected = answers[currentQ.id] === option;
            return (
              <button
                key={idx}
                onClick={() => selectOption(currentQ.id, option)}
                className={`w-full text-left p-4 sm:p-5 rounded-xl border-2 transition-all flex items-start gap-4 ${
                  isSelected 
                    ? 'border-red-600 bg-red-50 shadow-sm' 
                    : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  isSelected ? 'border-red-600' : 'border-gray-300'
                }`}>
                  {isSelected && <div className="w-3 h-3 rounded-full bg-red-600" />}
                </div>
                <span className={`text-base sm:text-lg ${isSelected ? 'font-medium text-red-900' : 'text-gray-700'}`}>
                  {option}
                </span>
              </button>
            )
          })}
        </div>

        {/* Navigation below question */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between items-center">
          <button
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Previous
          </button>
          
          {currentQuestionIndex < exam.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              className="inline-flex items-center px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
            >
              Next Question
              <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          ) : (
            <button
              onClick={submitExam}
              className={`inline-flex items-center px-8 py-3 text-sm font-bold text-white rounded-lg shadow-sm transition-colors ${
                allAnswered ? 'bg-red-700 hover:bg-red-800' : 'bg-red-400 hover:bg-red-500'
              }`}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Submit Exam
            </button>
          )}
        </div>
      </div>
      
      {/* Progress Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Overall Progress</span>
            <span className="text-xs font-bold text-red-700 uppercase">{Object.keys(answers).length} / {exam.questions.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(Object.keys(answers).length / exam.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
