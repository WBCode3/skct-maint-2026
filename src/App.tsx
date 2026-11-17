import React, { useEffect, useState } from 'react';
import { ExamWorkspace } from './components/ExamWorkspace';
import { Lobby } from './components/Lobby';
import { ResultView } from './components/ResultView';
import { MOCK_EXAMS } from './data';
import { ExamAttemptRecord, ExamConfig } from './types/exam';

const STORAGE_KEY = 'skct_maintenance_history_v1';
const THEME_STORAGE_KEY = 'skct_theme_v1';

export type ThemeMode = 'light' | 'dark';

type ScreenState =
  | { view: 'lobby' }
  | { view: 'exam'; config: ExamConfig }
  | { view: 'result'; record: ExamAttemptRecord };

export const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenState>({ view: 'lobby' });
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

  const handleStartExam = (config: ExamConfig) => {
    setScreen({ view: 'exam', config });
  };

  const handleCompleteExam = (record: ExamAttemptRecord) => {
    setHistory((prev) => [record, ...prev].slice(0, 30));
    setScreen({ view: 'result', record });
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
    const exam = MOCK_EXAMS.find((m) => m.id === screen.config.mockId) ?? MOCK_EXAMS[0];
    return (
      <ExamWorkspace
        exam={exam}
        config={screen.config}
        theme={theme}
        onToggleTheme={toggleTheme}
        onComplete={handleCompleteExam}
        onExitToLobby={() => setScreen({ view: 'lobby' })}
      />
    );
  }

  if (screen.view === 'result') {
    const exam = MOCK_EXAMS.find((m) => m.id === screen.record.mockId) ?? MOCK_EXAMS[0];
    return (
      <ResultView
        record={screen.record}
        exam={exam}
        theme={theme}
        onToggleTheme={toggleTheme}
        onBackToLobby={() => setScreen({ view: 'lobby' })}
      />
    );
  }

  return (
    <Lobby
      exams={MOCK_EXAMS}
      history={history}
      theme={theme}
      onToggleTheme={toggleTheme}
      onStartExam={handleStartExam}
      onViewHistoryResult={(record) => setScreen({ view: 'result', record })}
      onClearHistory={handleClearHistory}
    />
  );
};

export default App;
