import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Clock, Plus } from 'lucide-react';

export default function Dashboard() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/exams')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch exams');
        return res.json();
      })
      .then(data => {
        setExams(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-slate-200 pb-6 mb-8">
        <div>
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-slate-800">Exams Dashboard</h2>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-400 mt-2">Available tests for Holy Rosary College of Santa Rosa Laguna.</p>
        </div>
        <Link 
          to="/ingest" 
          className="inline-flex items-center justify-center bg-slate-900 text-white px-8 py-4 font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-colors whitespace-nowrap"
        >
          <Plus className="w-5 h-5 mr-3" />
          Create New Exam
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-400 font-bold uppercase tracking-widest text-sm">
          <Clock className="w-5 h-5 animate-spin mr-3" />
          Loading...
        </div>
      ) : error ? (
        <div className="p-6 border-2 border-red-600 bg-red-50 text-red-600 font-bold text-sm">
          Error: {error}
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white border-2 border-slate-200 p-16 text-center">
          <BookOpen className="mx-auto h-16 w-16 text-slate-300 mb-6" />
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">No exams found</h3>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-8">Create your first exam using AI or manually.</p>
          <Link to="/ingest" className="inline-flex items-center justify-center bg-slate-900 text-white px-8 py-4 font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-colors">Create Exam</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {exams.map(exam => (
            <div key={exam.id} className="bg-white border-2 border-slate-200 flex flex-col hover:border-slate-400 transition-all">
              <div className="p-8 flex-grow">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[10px] font-black uppercase bg-slate-900 text-white px-2 py-1">LIVE</span>
                  <span className="text-[10px] font-black uppercase text-slate-400">{new Date(exam.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 leading-tight mb-4 tracking-tight">{exam.title}</h3>
                <p className="text-sm text-slate-500 font-medium line-clamp-3 mb-4">{exam.description || 'No description provided.'}</p>
              </div>
              <div className="p-8 pt-0 mt-auto flex flex-col gap-3">
                <Link 
                  to={`/exam/${exam.id}`}
                  className="w-full text-center py-4 border-2 border-slate-900 font-black text-sm uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-colors"
                >
                  Take Exam
                </Link>
                <Link 
                  to={`/exam/${exam.id}/submissions`}
                  className="w-full text-center py-4 bg-slate-100 text-slate-600 font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-colors"
                >
                  View Submissions
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
