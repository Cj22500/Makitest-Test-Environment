import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, AlertCircle, Loader2, Sparkles, PenTool, Plus, Trash2, UploadCloud } from 'lucide-react';

export default function CreateExam() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // AI mode state
  const [text, setText] = useState('');
  const [fileData, setFileData] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  
  // Manual mode state
  const [questions, setQuestions] = useState([{ question_text: '', options: ['', '', '', ''], correct_answer: '', explanation: '' }]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setMimeType(file.type || 'application/octet-stream');
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        setFileData(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualQuestionChange = (index: number, field: string, value: string) => {
    const qs = [...questions];
    qs[index] = { ...qs[index], [field]: value } as any;
    setQuestions(qs);
  };

  const handleManualOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const qs = [...questions];
    qs[questionIndex].options[optionIndex] = value;
    if (qs[questionIndex].correct_answer === qs[questionIndex].options[optionIndex]) {
        // Just keeping it as string match to the option. If option changes, correct answer might mismatch but we enforce check on submit.
    }
    setQuestions(qs);
  };

  const addQuestion = () => setQuestions([...questions, { question_text: '', options: ['', '', '', ''], correct_answer: '', explanation: '' }]);
  const removeQuestion = (idx: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setError('Exam Title is required.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let response;
      if (mode === 'ai') {
          if (!text && !fileData) throw new Error('Source Text or Document is required for AI generation.');
          response = await fetch('/api/exams/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, text, fileData, mimeType })
          });
      } else {
         // Validate
         for (let i = 0; i < questions.length; i++) {
             const q = questions[i];
             if (!q.question_text || q.options.some(o => !o) || !q.correct_answer) {
                 throw new Error(`Question ${i + 1} is incomplete. All text, options, and a correct answer are required.`);
             }
             if (!q.options.includes(q.correct_answer)) {
                 throw new Error(`Question ${i + 1} correct answer must exactly match one of the options.`);
             }
         }
         response = await fetch('/api/exams/manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, questions })
         });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create exam.');
      }

      setSuccess(`Successfully created exam with ${data.questionsAdded} questions!`);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="border-b-2 border-slate-200 pb-6 mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="bg-slate-900 p-3">
             <FileText className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-slate-800">Create Exam</h2>
        </div>
        <p className="text-sm font-bold uppercase tracking-widest text-slate-400 mt-2">
          Generate an exams using AI or create them manually.
        </p>
      </div>

      <div className="flex gap-4">
        <button 
           type="button"
           onClick={() => setMode('ai')}
           className={`flex-1 flex items-center justify-center gap-3 py-5 border-2 font-black text-xs uppercase tracking-[0.1em] transition-all ${mode === 'ai' ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-700'}`}>
            <Sparkles className="w-5 h-5" /> Smart AI Ingestion
        </button>
        <button 
           type="button"
           onClick={() => setMode('manual')}
           className={`flex-1 flex items-center justify-center gap-3 py-5 border-2 font-black text-xs uppercase tracking-[0.1em] transition-all ${mode === 'manual' ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-700'}`}>
            <PenTool className="w-5 h-5" /> Manual Entry
        </button>
      </div>

      <div className="bg-white border-2 border-slate-200">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="border-2 border-red-600 bg-red-50 text-red-600 p-6 flex items-start">
              <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
              <p className="text-sm font-bold uppercase tracking-widest leading-relaxed">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="border-2 border-green-600 bg-green-50 text-green-700 p-6 flex items-start">
              <CheckCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
              <p className="text-sm font-bold uppercase tracking-widest leading-relaxed">{success}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Exam Title *</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. IT111: Network Fundamentals"
                  className="w-full px-4 py-4 border-2 border-slate-200 hover:border-slate-400 focus:border-slate-900 focus:ring-0 outline-none transition-all placeholder:text-slate-300 font-bold text-slate-900"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Description (Optional)</label>
                <input
                  id="description"
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description of the exam's scope"
                  className="w-full px-4 py-4 border-2 border-slate-200 hover:border-slate-400 focus:border-slate-900 focus:ring-0 outline-none transition-all placeholder:text-slate-300 font-bold text-slate-900"
                  disabled={loading}
                />
              </div>
            </div>

            {mode === 'ai' ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Upload Document (Optional)</label>
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 transition-colors font-bold text-sm uppercase tracking-widest flex items-center gap-2 shadow-xl">
                        <UploadCloud className="w-5 h-5" />
                        Choose File
                        <input type="file" accept=".pdf,.txt,.doc,.docx" className="hidden" onChange={handleFileUpload} disabled={loading} />
                      </label>
                      {fileName && <span className="text-sm font-bold text-slate-700 bg-slate-100 px-4 py-2">{fileName}</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="h-[2px] flex-1 bg-slate-200"></div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">OR PASTE TEXT</span>
                    <div className="h-[2px] flex-1 bg-slate-200"></div>
                  </div>

                  <div>
                    <label htmlFor="text" className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center justify-between">
                      <span>Source Text {fileData ? '' : '*'}</span>
                      {!fileData && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1">Min. 50 words recommended</span>}
                    </label>
                    <textarea
                      id="text"
                      value={text}
                      onChange={e => setText(e.target.value)}
                      rows={8}
                      placeholder="Paste the lesson material, articles, or PDF contents here. The AI will generate options, identify the correct answer, and provide explanations."
                      className="w-full px-4 py-4 border-2 border-slate-200 hover:border-slate-400 focus:border-slate-900 focus:ring-0 outline-none transition-all resize-y font-mono text-sm leading-relaxed text-slate-900 placeholder:text-slate-300"
                      disabled={loading || !!fileData}
                    />
                  </div>
                </div>
            ) : (
                <div className="space-y-8 pt-4 border-t-2 border-slate-100">
                    <h3 className="text-xl font-bold tracking-tight text-slate-800 uppercase">Questions Outline</h3>
                    {questions.map((q, qIndex) => (
                        <div key={qIndex} className="p-6 border-2 border-slate-200 bg-slate-50">
                            <div className="flex justify-between items-center mb-6">
                                <span className="bg-slate-900 text-white font-black px-3 py-1 text-xs uppercase tracking-widest">Question {qIndex + 1}</span>
                                {questions.length > 1 && (
                                    <button type="button" onClick={() => removeQuestion(qIndex)} className="text-slate-400 hover:text-red-600 transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Question Text *</label>
                                    <textarea
                                        value={q.question_text}
                                        onChange={e => handleManualQuestionChange(qIndex, 'question_text', e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-3 border-2 border-slate-200 hover:border-slate-400 focus:border-slate-900 focus:ring-0 outline-none transition-all resize-y text-sm font-bold text-slate-900 placeholder:text-slate-300"
                                        placeholder="Enter your question setup..."
                                        disabled={loading}
                                    />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {q.options.map((opt, optIndex) => (
                                        <div key={optIndex}>
                                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex justify-between items-center">
                                                <span>Option {String.fromCharCode(65 + optIndex)} *</span>
                                                <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => {
                                                    if(opt) handleManualQuestionChange(qIndex, 'correct_answer', opt);
                                                }}>
                                                    <input type="radio" name={`correct-${qIndex}`} checked={q.correct_answer === opt && opt !== ''} readOnly className="w-3 h-3 accent-green-600" />
                                                    <span className={`text-[10px] ${q.correct_answer === opt && opt !== '' ? 'text-green-700' : 'text-slate-400'}`}>CORRECT</span>
                                                </div>
                                            </label>
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={e => {
                                                    handleManualOptionChange(qIndex, optIndex, e.target.value)
                                                }}
                                                className={`w-full px-4 py-3 border-2 focus:ring-0 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-300 ${q.correct_answer === opt && opt !== '' ? 'border-green-600 bg-green-50' : 'border-slate-200 hover:border-slate-400 focus:border-slate-900 bg-white'}`}
                                                placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                                disabled={loading}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Explanation (Optional)</label>
                                    <input
                                        type="text"
                                        value={q.explanation}
                                        onChange={e => handleManualQuestionChange(qIndex, 'explanation', e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-slate-200 hover:border-slate-400 focus:border-slate-900 focus:ring-0 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-300 bg-white"
                                        placeholder="Why is this answer correct?"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    <button type="button" onClick={addQuestion} className="w-full py-4 border-2 border-slate-300 border-dashed text-slate-500 font-black uppercase tracking-[0.1em] text-xs hover:border-slate-900 hover:text-slate-900 transition-colors flex justify-center items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Another Question
                    </button>
                </div>
            )}
          </div>

          <div className="pt-6 border-t-2 border-slate-200">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center bg-slate-900 text-white px-10 py-5 font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  {mode === 'ai' ? 'ANALYZING & GENERATING...' : 'SAVING EXAM...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-3" />
                  CONFIRM & CREATE EXAM
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
