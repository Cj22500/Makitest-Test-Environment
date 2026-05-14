import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default function SubmissionDetails() {
  const { examId, attemptId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/attempts/${attemptId}/details`)
      .then(res => res.json())
      .then(result => {
        if (result.error) throw new Error(result.error);
        setData(result);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-400 font-bold uppercase tracking-widest text-sm">
        <Clock className="w-5 h-5 animate-spin mr-3" />
        Loading Details...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 border-2 border-red-600 bg-red-50 text-red-600 font-bold text-sm">
        Error: {error || 'Failed to load data'}
      </div>
    );
  }

  const { attempt, questions } = data;

  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <Link to={`/exam/${examId}/submissions`} className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Submissions
        </Link>
      </div>

      <div className="bg-slate-50 border-2 border-slate-200 p-8 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-slate-200 pb-6">
          <div>
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-800">
              {attempt.student_name}'s Submission
            </h2>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mt-2">
              {attempt.exam_title}
            </p>
          </div>
          <div className="bg-white border-2 border-slate-200 px-6 py-4 text-center">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Final Score</p>
            <p className="text-3xl font-black text-slate-900">
              {attempt.score !== null ? attempt.score : '-'} 
              <span className="text-lg text-slate-400 ml-1">/ {questions.length}</span>
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
            <p className="font-bold text-slate-800">{attempt.status === 'completed' ? 'Completed' : 'In Progress'}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Started</p>
            <p className="font-bold text-slate-800">{new Date(attempt.started_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Completed</p>
            <p className="font-bold text-slate-800">{attempt.completed_at ? new Date(attempt.completed_at).toLocaleString() : '-'}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold tracking-tight text-slate-800 border-b-2 border-slate-200 pb-2">Questions & Answers</h3>
        
        {questions.map((q: any, idx: number) => {
          const isCorrect = q.is_correct === 1;
          const statusColor = !q.selected_option ? 'border-slate-300' : (isCorrect ? 'border-green-500 bg-green-50/30' : 'border-red-500 bg-red-50/30');

          return (
            <div key={q.question_id} className={`p-6 border-2 ${statusColor} space-y-4 transition-colors`}>
              <div className="flex justify-between items-start gap-4">
                <h4 className="text-lg font-bold text-slate-800">
                  <span className="text-slate-400 mr-2">{idx + 1}.</span> 
                  {q.question_text}
                </h4>
                {q.selected_option && (
                  <div className="shrink-0 mt-1">
                    {isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3 mt-4">
                {q.options.map((opt: string, oIdx: number) => {
                  const isSelected = q.selected_option === opt;
                  const isActuallyCorrect = q.correct_answer === opt;
                  
                  let optStyle = "border-slate-200 bg-white text-slate-700";
                  let badge = null;

                  if (isActuallyCorrect) {
                    optStyle = "border-green-500 bg-green-50 text-green-900 font-bold";
                    badge = <span className="ml-auto text-xs font-black uppercase tracking-widest text-green-600 bg-green-100 px-2 py-1">Correct Answer</span>;
                  } else if (isSelected && !isActuallyCorrect) {
                    optStyle = "border-red-500 bg-red-50 text-red-900 font-bold";
                    badge = <span className="ml-auto text-xs font-black uppercase tracking-widest text-red-600 bg-red-100 px-2 py-1">Student Answer</span>;
                  } else if (isSelected && isActuallyCorrect) {
                     badge = <span className="ml-auto text-xs font-black uppercase tracking-widest text-green-600 bg-green-100 px-2 py-1">Correct Answer</span>;
                  }

                  return (
                    <div key={oIdx} className={`p-4 border-2 flex items-center ${optStyle}`}>
                      <div className="flex-1 flex items-center">
                        <span className="w-8 h-8 flex items-center justify-center border-2 border-current rounded-full mr-4 text-sm font-black disabled">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {badge}
                    </div>
                  )
                })}
              </div>

              {!isCorrect && q.explanation && q.selected_option && (
                <div className="mt-4 p-4 bg-slate-100 border-l-4 border-slate-400 text-slate-700 text-sm">
                  <p className="font-bold mb-1">Explanation:</p>
                  <p>{q.explanation}</p>
                </div>
              )}
              
              {!q.selected_option && (
                <div className="mt-4 p-3 bg-slate-100 text-slate-500 text-sm font-bold uppercase tracking-widest text-center">
                  Not Answered
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
