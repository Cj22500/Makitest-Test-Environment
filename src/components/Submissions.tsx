import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, ArrowLeft, Search } from 'lucide-react';

export default function Submissions() {
  const { examId } = useParams();
  const [exam, setExam] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/exams/${examId}`).then(res => res.json()),
      fetch(`/api/exams/${examId}/attempts`).then(res => res.json())
    ])
      .then(([examData, attemptsData]) => {
        if (examData.error) throw new Error(examData.error);
        if (attemptsData.error) throw new Error(attemptsData.error);
        setExam(examData);
        setSubmissions(attemptsData.attempts || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [examId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-400 font-bold uppercase tracking-widest text-sm">
        <Clock className="w-5 h-5 animate-spin mr-3" />
        Loading Submissions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border-2 border-red-600 bg-red-50 text-red-600 font-bold text-sm">
        Error: {error}
      </div>
    );
  }

  const filteredSubmissions = submissions.filter(s => 
    s.student_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>
      </div>

      <div className="border-b-2 border-slate-200 pb-6 mb-8">
        <h2 className="text-4xl font-bold leading-tight tracking-tight text-slate-800">
          Submissions
        </h2>
        <p className="text-sm font-bold uppercase tracking-widest text-slate-400 mt-2">
          {exam?.title}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search student by name..."
            className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 focus:border-slate-900 hover:border-slate-400 outline-none transition-colors font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="bg-slate-100 px-4 py-3 border-2 border-slate-200">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            Total Submissions: <span className="text-slate-900 ml-1">{submissions.length}</span>
          </p>
        </div>
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="bg-white border-2 border-slate-200 p-16 text-center">
          <div className="text-slate-400 font-bold text-xl tracking-tight">No submissions found</div>
          {searchTerm && <p className="text-sm font-medium text-slate-500 mt-2">Try a different search term.</p>}
        </div>
      ) : (
        <div className="overflow-x-auto border-2 border-slate-200 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200">
                <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-500">Student Name</th>
                <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-500">Status</th>
                <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-500">Started At</th>
                <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-500">Completed At</th>
                <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-500 text-right">Score</th>
                <th className="py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100">
              {filteredSubmissions.map((sub: any) => (
                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900">{sub.student_name}</div>
                  </td>
                  <td className="py-4 px-6">
                    {sub.status === 'completed' ? (
                      <span className="inline-flex items-center text-green-700 bg-green-50 px-2 py-1 text-xs font-black uppercase tracking-widest">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-amber-700 bg-amber-50 px-2 py-1 text-xs font-black uppercase tracking-widest">
                        <Clock className="w-3 h-3 mr-1" />
                        In Progress
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-sm font-medium text-slate-500">
                    {new Date(sub.started_at).toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-sm font-medium text-slate-500">
                    {sub.completed_at ? new Date(sub.completed_at).toLocaleString() : '-'}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="font-black text-lg text-slate-900">
                      {sub.score !== null ? `${sub.score}` : '-'} <span className="text-sm font-bold text-slate-400">/ {exam?.questions?.length || '?'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      to={`/exam/${examId}/submissions/${sub.id}`}
                      className="inline-block px-4 py-2 bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
