import React, { useEffect, useState } from 'react';
import { ExamWorkspace } from './components/ExamWorkspace';
import { Lobby } from './components/Lobby';
import { ResultView } from './components/ResultView';
import { loadMockExam, MOCK_EXAM_LIST } from './data';
import { ExamAttemptRecord, ExamConfig, MockExam } from './types/exam';

const STORAGE_KEY = 'skct_maintenance_history_v1';
const THEME_STORAGE_KEY = 'skct_theme_v1';

export type ThemeMode = 'light' | 'dark';

type ScreenState =
  | { view: 'lobby' }
  | { view: 'exam'; config: ExamConfig; exam: MockExam }
  | { view: 'result'; record: ExamAttemptRecord; exam: MockExam };

export const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenState>({ view: 'lobby' });
  const [loadingExamId, setLoadingExamId] = useState<number | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const [history, setHistory] = useState<ExamAttemptRecord[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Ignore storage quota errors
    }
  }, [history]);

  const handleStartExam = async (config: ExamConfig) => {
    if (loadingExamId !== null) return;
    setLoadingExamId(config.mockId);
    try {
      const exam = await loadMockExam(config.mockId);
      setScreen({ view: 'exam', config, exam });
    } finally {
      setLoadingExamId(null);
    }
  };

  const handleViewHistoryResult = async (record: ExamAttemptRecord) => {
    if (loadingExamId !== null) return;
    setLoadingExamId(record.mockId);
    try {
      const exam = await loadMockExam(record.mockId);
      setScreen({ view: 'result', record, exam });
    } finally {
      setLoadingExamId(null);
    }
  };

  const handleCompleteExam = (record: ExamAttemptRecord, exam: MockExam) => {
    setHistory((prev) => [record, ...prev].slice(0, 30));
    setScreen({ view: 'result', record, exam });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  if (screen.view === 'exam') {
    return (
      <ExamWorkspace
        exam={screen.exam}
        config={screen.config}
        theme={theme}
        onToggleTheme={toggleTheme}
        onComplete={(record) => handleCompleteExam(record, screen.exam)}
        onExitToLobby={() => setScreen({ view: 'lobby' })}
      />
    );
  }

  if (screen.view === 'result') {
    return (
      <ResultView
        record={screen.record}
        exam={screen.exam}
        theme={theme}
        onToggleTheme={toggleTheme}
        onBackToLobby={() => setScreen({ view: 'lobby' })}
      />
    );
  }

  return (
    <Lobby
      exams={MOCK_EXAM_LIST}
      history={history}
      theme={theme}
      loadingExamId={loadingExamId}
      onToggleTheme={toggleTheme}
      onStartExam={handleStartExam}
      onViewHistoryResult={handleViewHistoryResult}
      onClearHistory={handleClearHistory}
    />
  );
};

export default App;
