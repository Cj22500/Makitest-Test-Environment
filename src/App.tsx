/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import CreateExam from './components/CreateExam';
import TakeExam from './components/TakeExam';
import Submissions from './components/Submissions';
import SubmissionDetails from './components/SubmissionDetails';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col overflow-x-hidden">
        <header className="bg-white border-b-2 border-slate-200 h-20 flex items-center px-4 md:px-8 flex-shrink-0 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex w-full items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-red-700 text-white px-3 py-1 font-black text-2xl tracking-tighter italic"><a href="/">MAKITEST</a></div>
              <div className="h-8 w-[1px] bg-slate-300 hidden md:block"></div>
              <div className="hidden md:block">
                <h1 className="text-xs font-bold uppercase tracking-widest text-slate-400">Institution</h1>
                <p className="text-sm font-bold text-slate-700 leading-none">Holy Rosary College of Santa Rosa Laguna</p>
              </div>
            </div>
            <nav className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
              <a href="/" className="hover:text-slate-900 transition-colors">Dashboard</a>
              <a href="/ingest" className="hover:text-slate-900 transition-colors">Create Exam</a>
            </nav>
          </div>
        </header>
        <main className="flex-1 w-full flex flex-col">
          <div className="max-w-7xl mx-auto p-4 md:p-8 w-full flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ingest" element={<CreateExam />} />
            <Route path="/exam/:examId" element={<TakeExam />} />
            <Route path="/exam/:examId/submissions" element={<Submissions />} />
            <Route path="/exam/:examId/submissions/:attemptId" element={<SubmissionDetails />} />
          </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
