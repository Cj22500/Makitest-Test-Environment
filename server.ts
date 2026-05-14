import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = new Database('makitest.db', { verbose: console.log });
db.pragma('journal_mode = WAL');

// Initialize schema in SQLite (adapted from PostgreSQL)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      options TEXT NOT NULL, -- JSON array
      correct_answer TEXT NOT NULL,
      explanation TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      exam_id INTEGER NOT NULL,
      consent_given BOOLEAN NOT NULL DEFAULT 0,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      score INTEGER,
      status TEXT DEFAULT 'in_progress',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS attempt_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attempt_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      selected_option TEXT NOT NULL,
      is_correct BOOLEAN NOT NULL,
      answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(attempt_id, question_id),
      FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Create an exam via Gemini Parsing
  app.post('/api/exams/parse', async (req, res) => {
    try {
      const { text, title, description, fileData, mimeType } = req.body;
      if ((!text && !fileData) || !title) {
        return res.status(400).json({ error: 'Missing document/text or title' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not found' });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const promptParts = fileData && mimeType ? [
        {
          inlineData: {
            data: fileData,
            mimeType: mimeType
          }
        },
        { text: "Parse the document into multiple choice questions." }
      ] : `Parse the following text into multiple choice questions:\n\n${text}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: promptParts as any,
        config: {
          systemInstruction: "You are an expert test creator. Extract facts from the provided text and turn them into multiple choice questions. Always provide exactly 4 options. Indicate the exact correct answer text.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question_text: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "Exactly 4 string options for the question"
                },
                correct_answer: { type: Type.STRING, description: "The exact text of the correct option" },
                explanation: { type: Type.STRING, description: "Why the answer is correct" }
              },
              required: ["question_text", "options", "correct_answer", "explanation"]
            }
          }
        }
      });

      const parsedQuestions = JSON.parse(response.text || '[]');

      // Insert into DB
      const insertExam = db.prepare('INSERT INTO exams (title, description) VALUES (?, ?)');
      const examResult = insertExam.run(title, description || '');
      const examId = examResult.lastInsertRowid;

      const insertQuestion = db.prepare('INSERT INTO questions (exam_id, question_text, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?)');
      
      const insertQuestionsTx = db.transaction((questions) => {
        for (const q of questions) {
          insertQuestion.run(examId, q.question_text, JSON.stringify(q.options), q.correct_answer, q.explanation);
        }
      });

      insertQuestionsTx(parsedQuestions);

      res.json({ success: true, examId, questionsAdded: parsedQuestions.length });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create an exam manually
  app.post('/api/exams/manual', (req, res) => {
    try {
      const { title, description, questions } = req.body;
      if (!title || !questions || questions.length === 0) {
        return res.status(400).json({ error: 'Title and at least one question are required' });
      }

      const insertExam = db.prepare('INSERT INTO exams (title, description) VALUES (?, ?)');
      const examResult = insertExam.run(title, description || '');
      const examId = examResult.lastInsertRowid;

      const insertQuestion = db.prepare('INSERT INTO questions (exam_id, question_text, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?)');
      
      const insertQuestionsTx = db.transaction((qs) => {
        for (const q of qs) {
          insertQuestion.run(examId, q.question_text, JSON.stringify(q.options), q.correct_answer, q.explanation || '');
        }
      });

      insertQuestionsTx(questions);

      res.json({ success: true, examId, questionsAdded: questions.length });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get Exams
  app.get('/api/exams', (req, res) => {
    const exams = db.prepare('SELECT * FROM exams ORDER BY created_at DESC').all();
    res.json(exams);
  });

  // Get Exam by ID (with questions)
  app.get('/api/exams/:id', (req, res) => {
    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id) as any;
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    
    const questions = db.prepare('SELECT id, question_text, options FROM questions WHERE exam_id = ?').all(req.params.id) as any[];
    questions.forEach(q => {
      q.options = JSON.parse(q.options);
    });

    res.json({ ...exam, questions });
  });

  // Get Attempts for an Exam
  app.get('/api/exams/:id/attempts', (req, res) => {
    try {
      const examId = req.params.id;
      const attempts = db.prepare(`
        SELECT a.id, a.started_at, a.completed_at, a.score, a.status, u.name as student_name, u.email as student_email
        FROM attempts a
        JOIN users u ON a.user_id = u.id
        WHERE a.exam_id = ?
        ORDER BY a.started_at DESC
      `).all(examId);
      
      const qCountRow = db.prepare('SELECT count(*) as total FROM questions WHERE exam_id = ?').get(examId) as any;
      
      res.json({ attempts, totalQuestions: qCountRow.total });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get Attempt Details including answers
  app.get('/api/attempts/:id/details', (req, res) => {
    try {
      const attemptId = req.params.id;
      
      // Get attempt info
      const attempt = db.prepare(`
        SELECT a.*, u.name as student_name, e.title as exam_title
        FROM attempts a
        JOIN users u ON a.user_id = u.id
        JOIN exams e ON a.exam_id = e.id
        WHERE a.id = ?
      `).get(attemptId) as any;

      if (!attempt) {
        return res.status(404).json({ error: 'Attempt not found' });
      }

      // Get questions and answers
      const questionsAndAnswers = db.prepare(`
        SELECT 
          q.id as question_id,
          q.question_text,
          q.options,
          q.correct_answer,
          q.explanation,
          aa.selected_option,
          aa.is_correct
        FROM questions q
        LEFT JOIN attempt_answers aa ON q.id = aa.question_id AND aa.attempt_id = ?
        WHERE q.exam_id = ?
        ORDER BY q.id ASC
      `).all(attemptId, attempt.exam_id) as any[];

      // Parse JSON options
      questionsAndAnswers.forEach(qa => {
        if (typeof qa.options === 'string') {
          qa.options = JSON.parse(qa.options);
        }
      });

      res.json({
        attempt,
        questions: questionsAndAnswers
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Create an attempt and agree to DPA
  app.post('/api/attempts', (req, res) => {
    const { user_id, exam_id, consent_given, student_name } = req.body;
    if (!consent_given) return res.status(400).json({ error: 'DPA consent is required to start' });

    let userId = user_id;
    // Mock user creation for demo if user_id is missing
    if (!userId) {
      if (!student_name) return res.status(400).json({ error: 'Student name is required' });
      const insertUser = db.prepare("INSERT OR IGNORE INTO users (name, email) VALUES (?, ?)");
      insertUser.run(student_name, `${student_name.replace(/\s+/g, '').toLowerCase()}_${Date.now()}@hrcsrl.edu.ph`);
      userId = (db.prepare("SELECT id FROM users ORDER BY id DESC LIMIT 1").get() as any).id;
    }

    const insertAttempt = db.prepare('INSERT INTO attempts (user_id, exam_id, consent_given) VALUES (?, ?, ?)');
    const result = insertAttempt.run(userId, exam_id, 1);
    
    res.json({ attemptId: result.lastInsertRowid, userId });
  });

  // Heartbeat / Sync answers offline-first style
  app.post('/api/attempts/:id/sync', (req, res) => {
    const attemptId = req.params.id;
    const { answers } = req.body; // { question_id: selected_option }

    const updateAttemptAnswers = db.transaction((answersDict) => {
      for (const [qId, selectedOpt] of Object.entries(answersDict)) {
        // Grade it instantly on backend
        const question = db.prepare('SELECT correct_answer FROM questions WHERE id = ?').get(qId) as any;
        if (question) {
          const isCorrect = question.correct_answer === selectedOpt;
          const insertStmt = db.prepare(`
            INSERT INTO attempt_answers (attempt_id, question_id, selected_option, is_correct) 
            VALUES (?, ?, ?, ?)
            ON CONFLICT(attempt_id, question_id) DO UPDATE SET selected_option = excluded.selected_option, is_correct = excluded.is_correct, answered_at = CURRENT_TIMESTAMP
          `);
          insertStmt.run(attemptId, qId, selectedOpt as string, isCorrect ? 1 : 0);
        }
      }
    });

    try {
      updateAttemptAnswers(answers);
      res.json({ success: true, syncedAt: new Date().toISOString() });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Submit/Complete exam
  app.post('/api/attempts/:id/submit', (req, res) => {
    const attemptId = req.params.id;
    const { answers } = req.body; // Full final set
    
    try {
      // Sync last answers first
      const updateAttemptAnswers = db.transaction((answersDict) => {
        for (const [qId, selectedOpt] of Object.entries(answersDict)) {
          const question = db.prepare('SELECT correct_answer FROM questions WHERE id = ?').get(qId) as any;
          if (question) {
            const isCorrect = question.correct_answer === selectedOpt;
            const insertStmt = db.prepare(`
              INSERT INTO attempt_answers (attempt_id, question_id, selected_option, is_correct) 
              VALUES (?, ?, ?, ?)
              ON CONFLICT(attempt_id, question_id) DO UPDATE SET selected_option = excluded.selected_option, is_correct = excluded.is_correct, answered_at = CURRENT_TIMESTAMP
            `);
            insertStmt.run(attemptId, qId, selectedOpt as string, isCorrect ? 1 : 0);
          }
        }
      });
      updateAttemptAnswers(answers);

      // Calculate score
      const scoreRow = db.prepare('SELECT count(*) as score FROM attempt_answers WHERE attempt_id = ? AND is_correct = 1').get(attemptId) as any;
      const score = scoreRow.score;

      db.prepare("UPDATE attempts SET status = 'completed', score = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?").run(score, attemptId);
      
      const qCountRow = db.prepare('SELECT count(*) as total FROM attempt_answers WHERE attempt_id = ?').get(attemptId) as any;
      res.json({ success: true, score, totalAnswered: qCountRow.total });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
