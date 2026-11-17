import React, { useState } from 'react';
import { ExamMode, Question, ViewMode } from '../types/exam';

interface OmrPanelProps {
  questions: Question[];
  answers: Record<string, number | null>;
  bookmarks: Record<string, boolean>;
  currentIndex: number;
  maxReachedIndex: number;
  mode: ExamMode;
  viewMode: ViewMode;
  allowBackInRealSingle: boolean;
  onSelectQuestion: (index: number) => void;
  onSelectAnswer: (questionId: string, optionIndex: number | null) => void;
  onToggleBookmark: (questionId: string) => void;
  onResetSubjectAnswers: () => void;
  onSubmitSubject: () => void;
}

export const OmrPanel: React.FC<OmrPanelProps> = ({
  questions,
  answers,
  bookmarks,
  currentIndex,
  maxReachedIndex,
  mode,
  viewMode,
  allowBackInRealSingle,
  onSelectQuestion,
  onSelectAnswer,
  onToggleBookmark,
  onResetSubjectAnswers,
  onSubmitSubject,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const answeredCount = questions.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] !== null,
  ).length;

  const isStrictSingleLocked = (idx: number) =>
    mode === 'real' && viewMode === 'single' && !allowBackInRealSingle && idx < currentIndex;

  const canJumpTo = (idx: number) => {
    if (mode === 'practice') return true;
    if (viewMode === 'multi') return true;
    if (allowBackInRealSingle) return true;
    // In strict single-question mode, cannot jump back to earlier questions or skip arbitrarily ahead beyond maxReachedIndex+1
    return idx >= currentIndex && idx <= maxReachedIndex + 1;
  };

  return (
    <div className="omr-wrapper">
      <aside className={`omr-panel ${collapsed ? 'collapsed' : ''}`}>
        <div className="omr-header">
          <div className="omr-title-row">
            <span className="omr-title">OMR 답안지 · 문제선택</span>
          </div>
          <div className="omr-actions">
            <button type="button" className="btn btn-primary" onClick={onSubmitSubject}>
              {mode === 'practice' ? '채점하기' : '영역 제출'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onResetSubjectAnswers}
              disabled={mode === 'real' && viewMode === 'single' && !allowBackInRealSingle}
              title={
                mode === 'real' && viewMode === 'single' && !allowBackInRealSingle
                  ? '순차 진행 모드에서는 초기화할 수 없습니다'
                  : '현재 영역 답안 초기화'
              }
            >
              답안 초기화
            </button>
          </div>
        </div>

        <div className="omr-list">
          {questions.map((q, idx) => {
            const selected = answers[q.id] ?? null;
            const locked = isStrictSingleLocked(idx);
            const jumpAllowed = canJumpTo(idx);
            const isCurrent = viewMode === 'single' ? idx === currentIndex : idx === currentIndex;

            return (
              <div
                key={q.id}
                className={`omr-row ${isCurrent ? 'current' : ''} ${locked ? 'locked' : ''}`}
              >
                <button
                  type="button"
                  className="omr-qnum"
                  disabled={!jumpAllowed}
                  onClick={() => onSelectQuestion(idx)}
                  title={jumpAllowed ? `${q.number}번 문제로 이동` : '이전 문항 이동 불가'}
                >
                  {q.number}
                </button>

                <div className="omr-bubbles">
                  {[0, 1, 2, 3, 4].map((optIdx) => {
                    const active = selected === optIdx;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        className={`omr-bubble ${active ? 'selected' : ''}`}
                        disabled={locked || (mode === 'real' && viewMode === 'single' && !allowBackInRealSingle && idx !== currentIndex)}
                        onClick={() => {
                          onSelectAnswer(q.id, active ? null : optIdx);
                          if (jumpAllowed) {
                            onSelectQuestion(idx);
                          }
                        }}
                      >
                        {optIdx + 1}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className={`omr-bookmark-btn ${bookmarks[q.id] ? 'marked' : ''}`}
                  onClick={() => onToggleBookmark(q.id)}
                  title="헷갈리는 문제 표시"
                >
                  {bookmarks[q.id] ? '★' : '☆'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="omr-footer">
          <span>표시한 답안</span>
          <span>
            {answeredCount} / {questions.length}
          </span>
        </div>
      </aside>

      <button
        type="button"
        className={`omr-collapse-tab ${collapsed ? 'closed' : ''}`}
        onClick={() => setCollapsed((c) => !c)}
      >
        {collapsed ? '▶ OMR 펼치기' : '◀ OMR 숨기기'}
      </button>
    </div>
  );
};
