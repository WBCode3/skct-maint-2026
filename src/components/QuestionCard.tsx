import React from 'react';
import { ExamMode, Question } from '../types/exam';
import { DataVisual } from './DataVisual';

interface QuestionCardProps {
  question: Question;
  selectedOption: number | null;
  bookmarked: boolean;
  mode: ExamMode;
  singleView: boolean;
  fontSize: number;
  showInstantAnswer: boolean;
  onSelectAnswer: (optionIndex: number | null) => void;
  onToggleBookmark: () => void;
  onToggleInstantAnswer: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedOption,
  bookmarked,
  mode,
  singleView,
  fontSize,
  showInstantAnswer,
  onSelectAnswer,
  onToggleBookmark,
  onToggleInstantAnswer,
}) => {
  const reveal = mode === 'practice' && showInstantAnswer;

  return (
    <div
      id={`question-${question.id}`}
      className={`question-card ${singleView ? 'single-view' : ''}`}
    >
      <div className="q-stem-header">
        <div className="q-stem-main" style={{ fontSize: `${fontSize + 1}px` }}>
          <span className="q-num-badge">{String(question.number).padStart(2, '0')}</span>
          <span>{question.prompt}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {mode === 'practice' && (
            <span className="q-subtype-tag">{question.subType}</span>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onToggleBookmark}
            title="다시 볼 문제 표시"
            style={{
              color: bookmarked ? '#F47725' : '#718096',
              borderColor: bookmarked ? '#F47725' : undefined,
            }}
          >
            {bookmarked ? '★ 표시됨' : '☆ 표시'}
          </button>
        </div>
      </div>

      {question.passage && (
        <div className="q-passage" style={{ fontSize: `${fontSize}px` }}>
          {question.passage}
        </div>
      )}

      {(question.table || question.chart) && (
        <DataVisual table={question.table} chart={question.chart} />
      )}

      {question.bogi && question.bogi.length > 0 && (
        <div className="q-bogi">
          <div className="q-bogi-title">&lt; 보 기 &gt;</div>
          {question.bogi.map((item, idx) => (
            <div key={idx} className="q-bogi-item" style={{ fontSize: `${fontSize - 0.5}px` }}>
              {item}
            </div>
          ))}
        </div>
      )}

      <div className="q-options">
        {question.options.map((opt, idx) => {
          const isSelected = selectedOption === idx;
          const isCorrect = idx === question.answer;
          let cls = 'q-option';
          if (reveal) {
            if (isCorrect) cls += ' correct';
            else if (isSelected) cls += ' wrong';
          } else if (isSelected) {
            cls += ' selected';
          }

          return (
            <button
              key={idx}
              type="button"
              className={cls}
              style={{ fontSize: `${fontSize}px` }}
              onClick={() => onSelectAnswer(isSelected ? null : idx)}
            >
              <span className="q-opt-num">{idx + 1}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {mode === 'practice' && (
        <>
          <div className="q-practice-bar">
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              선택한 답안을 다시 클릭하면 선택 해제(패스)됩니다.
            </span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onToggleInstantAnswer}
            >
              {showInstantAnswer ? '정답/해설 닫기' : '정답 · 해설 확인'}
            </button>
          </div>
          {showInstantAnswer && (
            <div className="q-explanation-box">
              <div style={{ fontWeight: 700, marginBottom: '4px', color: '#1a202c' }}>
                정답: {question.answer + 1}번
                {selectedOption !== null && (
                  <span
                    style={{
                      marginLeft: '8px',
                      color: selectedOption === question.answer ? '#15803d' : '#dc2626',
                    }}
                  >
                    ({selectedOption === question.answer ? '정답입니다' : `선택: ${selectedOption + 1}번`})
                  </span>
                )}
              </div>
              <div>{question.explanation}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
