# MakiTest Assessment & AI Exam Generation Platform

A full-stack online examination, assessment, and AI-assisted question generation platform built with **React 19**, **TypeScript**, **Node.js / Express (`server.ts`)**, **Relational SQL (`schema.sql` / SQLite)**, and the **Google Gemini API (`@google/genai`)**. Designed as the web assessment and data-collection companion environment for the **MakiTest** proctoring ecosystem.

## Key Engineering Highlights
- **Relational Assessment Schema (`schema.sql` & `server.ts`)**: Normalized SQL schema managing `users`, `exams`, `questions`, `attempts`, and `attempt_answers` with foreign-key cascade constraints and unique attempt-question indexing.
- **Multimodal Gemini AI Exam Generator**: Converts uploaded study documents or raw lecture text into structured multiple-choice assessments via the `@google/genai` SDK.
- **End-to-End Exam Lifecycle API**: REST endpoints supporting exam creation, timed student exam attempts, automated scoring, and analytics collection.

## Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Vite
- **Backend & Database**: Node.js, Express (`server.ts`), Relational SQL (`better-sqlite3` / `schema.sql`), `@google/genai`

## Local Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `GEMINI_API_KEY` in `.env.local` and run:
   ```bash
   npm run dev
   ```
