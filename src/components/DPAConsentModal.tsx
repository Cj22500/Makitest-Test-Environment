import React, { useState } from 'react';
import { Shield, AlertTriangle, User } from 'lucide-react';

interface DPAConsentModalProps {
  onAccept: (name: string) => void;
  onDecline: () => void;
}

export default function DPAConsentModal({ onAccept, onDecline }: DPAConsentModalProps) {
  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState('');

  const handleAccept = () => {
    if (!studentName.trim()) {
      setError('Please enter your full name to proceed.');
      return;
    }
    onAccept(studentName.trim());
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white border-4 border-slate-900 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-red-700 p-6 flex items-start gap-4">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Data Privacy Act Consent</h2>
            <p className="text-xs font-bold uppercase tracking-widest text-red-200 mt-1">Republic Act No. 10173</p>
          </div>
        </div>
        
        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto w-full">
          <div className="bg-orange-50 border-2 border-orange-200 p-4 flex gap-3 text-orange-800">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-bold uppercase tracking-widest">
              You must agree to these terms before starting any session on Makitest.
            </p>
          </div>

          <div className="space-y-4 text-sm font-medium text-slate-700 leading-relaxed">
            <p className="font-bold text-slate-900">
              In compliance with the Data Privacy Act of 2012 (R.A. 10173), we require your explicit consent to collect, use, and process your personal and academic information. 
            </p>
            <p>
              By participating in this examination via <strong className="font-bold text-slate-900">Makitest</strong>, you acknowledge and agree that:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Your name, email address, and academic scores will be recorded and stored securely.</li>
              <li>Your answers, response times, and testing progress (including offline-synced data) are collected to ensure exam integrity and provide academic analytics.</li>
              <li>This data will solely be used for academic assessment by Holy Rosary College of Santa Rosa Laguna and its authorized instructors.</li>
              <li>Your data will not be shared with third parties without your explicit, written consent unless required by law.</li>
            </ul>
            <p>
              You have the right to access, correct, or request the deletion of your personal data at any time by contacting the Data Protection Officer (DPO) of the institution.
            </p>
          </div>

          <div className="border-t-2 border-slate-200 pt-6 mt-6">
            <label htmlFor="studentName" className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
              Full Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="studentName"
                type="text"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  setError('');
                }}
                className={`w-full pl-12 pr-4 py-4 border-2 ${error ? 'border-red-500' : 'border-slate-200 hover:border-slate-400 focus:border-slate-900'} focus:ring-0 outline-none transition-all placeholder:text-slate-300 font-bold text-slate-900`}
                placeholder="Enter your full name"
              />
            </div>
            {error && <p className="mt-2 text-sm font-bold text-red-600">{error}</p>}
          </div>
        </div>

        <div className="border-t-2 border-slate-200 p-6 flex flex-col-reverse sm:flex-row gap-4 sm:justify-end bg-slate-50 mt-auto">
          <button 
            onClick={onDecline}
            className="w-full sm:w-auto px-8 py-4 border-2 border-slate-900 font-black text-sm uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-colors"
          >
            I Decline
          </button>
          <button 
            onClick={handleAccept}
            className="w-full sm:w-auto px-8 py-4 bg-red-700 text-white font-black text-sm uppercase tracking-widest shadow-xl hover:bg-red-800 transition-colors border-2 border-red-700"
          >
            I Accept & Start Exam
          </button>
        </div>
      </div>
    </div>
  );
}
