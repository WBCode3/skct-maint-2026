import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SUBJECT_MAP } from '../data/subjects';
import {
  ExamAttemptRecord,
  ExamConfig,
  MockExam,
  SubjectId,
  SubjectResult,
  ViewMode,
} from '../types/exam';
import { Calculator } from './Calculator';
import { OmrPanel } from './OmrPanel';
import { QuestionCard } from './QuestionCard';
import { ScratchPad } from './ScratchPad';

interface ExamWorkspaceProps {
  exam: MockExam;
  config: ExamConfig;
  onComplete: (record: ExamAttemptRecord) => void;
  onExitToLobby: () => void;
}

function formatMMSS(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}분 ${String(rem).padStart(2, '0')}초`;
}

export const ExamWorkspace: React.FC<ExamWorkspaceProps> = ({
  exam,
  config,
  onComplete,
  onExitToLobby,
}) => {
  const subjects = config.selectedSubjects;
  const [subjectIdx, setSubjectIdx] = useState<number>(0);
  const currentSubjectId: SubjectId = subjects[subjectIdx];
  const currentMeta = SUBJECT_MAP[currentSubjectId];

  const [viewMode, setViewMode] = useState<ViewMode>(config.viewMode);
  const [fontSize, setFontSize] = useState<number>(17);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [instantRevealed, setInstantRevealed] = useState<Record<string, boolean>>({});

  // Per-subject question index & max reached index (for strict sequential mode)
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [maxReachedIndex, setMaxReachedIndex] = useState<number>(0);
  const [clearScratchSignal, setClearScratchSignal] = useState<number>(0);

  // Timer state
  const [isReadyOverlay, setIsReadyOverlay] = useState<boolean>(config.mode === 'real');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [subjectTimeLimit, setSubjectTimeLimit] = useState<number>(
    config.customTimeMultiplier === 0 ? 0 : currentMeta.timeLimitSeconds,
  );
  const [secondsLeft, setSecondsLeft] = useState<number>(
    config.customTimeMultiplier === 0 ? 0 : currentMeta.timeLimitSeconds,
  );
  const [elapsedPerSubject, setElapsedPerSubject] = useState<Record<SubjectId, number>>({
    verbal_expr: 0,
    verbal_comp: 0,
    creative_math: 0,
    data_interp: 0,
  });

  // Modals
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [skipConfirmTarget, setSkipConfirmTarget] = useState<number | null>(null);
  const [suppressSkipConfirm, setSuppressSkipConfirm] = useState<boolean>(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const subjectQuestions = useMemo(
    () => exam.questions.filter((q) => q.subject === currentSubjectId),
    [exam.questions, currentSubjectId],
  );

  const currentQuestion = subjectQuestions[questionIndex] ?? subjectQuestions[0];

  const finishExam = useCallback(
    (finalElapsedMap: Record<SubjectId, number>) => {
      const subjectResults: SubjectResult[] = subjects.map((sid) => {
        const meta = SUBJECT_MAP[sid];
        const qs = exam.questions.filter((q) => q.subject === sid);
        let answered = 0;
        let correct = 0;
        let wrong = 0;
        qs.forEach((q) => {
          const ans = answers[q.id] ?? null;
          if (ans !== null) {
            answered++;
            if (ans === q.answer) correct++;
            else wrong++;
          }
        });
        return {
          subject: sid,
          total: qs.length,
          answered,
          correct,
          wrong,
          unanswered: qs.length - answered,
          timeSpentSeconds: finalElapsedMap[sid] ?? 0,
          timeLimitSeconds: meta.timeLimitSeconds,
        };
      });

      const totalCorrect = subjectResults.reduce((a, r) => a + r.correct, 0);
      const totalWrong = subjectResults.reduce((a, r) => a + r.wrong, 0);
      const totalUnanswered = subjectResults.reduce((a, r) => a + r.unanswered, 0);
      const totalQuestions = subjectResults.reduce((a, r) => a + r.total, 0);
      const totalTimeSpentSeconds = subjectResults.reduce(
        (a, r) => a + r.timeSpentSeconds,
        0,
      );
      const estimatedNetScore = Math.max(0, totalCorrect - totalWrong * 0.25);

      const record: ExamAttemptRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        mockId: exam.id,
        mockTitle: exam.title,
        mode: config.mode,
        viewMode,
        completedAt: new Date().toISOString(),
        answers,
        bookmarks,
        subjectResults,
        totalCorrect,
        totalWrong,
        totalUnanswered,
        totalQuestions,
        estimatedNetScore,
        totalTimeSpentSeconds,
      };
      onComplete(record);
    },
    [answers, bookmarks, config.mode, exam, onComplete, subjects, viewMode],
  );

  const advanceToNextSubject = useCallback(
    (autoTriggered: boolean) => {
      if (subjectIdx + 1 < subjects.length) {
        const nextIdx = subjectIdx + 1;
        const nextMeta = SUBJECT_MAP[subjects[nextIdx]];
        setSubjectIdx(nextIdx);
        setQuestionIndex(0);
        setMaxReachedIndex(0);
        setClearScratchSignal((n) => n + 1);
        setSubjectTimeLimit(
          config.customTimeMultiplier === 0 ? 0 : nextMeta.timeLimitSeconds,
        );
        setSecondsLeft(
          config.customTimeMultiplier === 0 ? 0 : nextMeta.timeLimitSeconds,
        );
        setIsPaused(false);
        if (config.mode === 'real' || autoTriggered) {
          setIsReadyOverlay(config.mode === 'real');
        }
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = 0;
        }
      } else {
        finishExam(elapsedPerSubject);
      }
    },
    [config.customTimeMultiplier, config.mode, elapsedPerSubject, finishExam, subjectIdx, subjects],
  );

  // Countdown / Elapsed timer tick
  useEffect(() => {
    if (isReadyOverlay || isPaused) return;

    const timer = window.setInterval(() => {
      setElapsedPerSubject((prev) => ({
        ...prev,
        [currentSubjectId]: (prev[currentSubjectId] ?? 0) + 1,
      }));

      if (subjectTimeLimit > 0) {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            window.clearInterval(timer);
            // Auto advance when timer expires
            setTimeout(() => advanceToNextSubject(true), 0);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [advanceToNextSubject, currentSubjectId, isPaused, isReadyOverlay, subjectTimeLimit]);

  const handleSelectAnswer = (questionId: string, optionIndex: number | null) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleToggleBookmark = (questionId: string) => {
    setBookmarks((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleJumpOrMoveTo = (targetIdx: number) => {
    if (targetIdx < 0 || targetIdx >= subjectQuestions.length) return;

    if (viewMode === 'multi') {
      setQuestionIndex(targetIdx);
      const q = subjectQuestions[targetIdx];
      if (q) {
        const el = document.getElementById(`question-${q.id}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    // Single view
    if (
      config.mode === 'real' &&
      !config.allowBackInRealSingle &&
      targetIdx < questionIndex
    ) {
      return; // Strict SKCT rule: cannot return to previous question
    }

    if (
      config.mode === 'real' &&
      !suppressSkipConfirm &&
      targetIdx > questionIndex &&
      (answers[currentQuestion.id] === undefined || answers[currentQuestion.id] === null)
    ) {
      setSkipConfirmTarget(targetIdx);
      return;
    }

    performSingleMove(targetIdx);
  };

  const performSingleMove = (targetIdx: number) => {
    if (targetIdx > questionIndex && config.autoClearScratchOnNext) {
      setClearScratchSignal((n) => n + 1);
    }
    setQuestionIndex(targetIdx);
    setMaxReachedIndex((m) => Math.max(m, targetIdx));
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  };

  const handleResetSubjectAnswers = () => {
    setAnswers((prev) => {
      const next = { ...prev };
      subjectQuestions.forEach((q) => {
        delete next[q.id];
      });
      return next;
    });
  };

  const handlePracticeSubjectSwitch = (idx: number) => {
    if (config.mode !== 'practice') return;
    const nextMeta = SUBJECT_MAP[subjects[idx]];
    setSubjectIdx(idx);
    setQuestionIndex(0);
    setMaxReachedIndex(0);
    setSubjectTimeLimit(
      config.customTimeMultiplier === 0 ? 0 : nextMeta.timeLimitSeconds,
    );
    setSecondsLeft(
      config.customTimeMultiplier === 0 ? 0 : nextMeta.timeLimitSeconds,
    );
    if (scrollAreaRef.current) scrollAreaRef.current.scrollTop = 0;
  };

  const handlePracticeTimePreset = (minutes: number) => {
    const secs = minutes * 60;
    setSubjectTimeLimit(secs);
    setSecondsLeft(secs);
    setIsPaused(false);
  };

  const isUrgent = subjectTimeLimit > 0 && secondsLeft <= 30;
  const isWarning = subjectTimeLimit > 60 && secondsLeft > 30 && secondsLeft <= 60;
  const timeProgressPct =
    subjectTimeLimit > 0 ? Math.max(0, Math.min(100, (secondsLeft / subjectTimeLimit) * 100)) : 0;

  return (
    <div className="cbt-shell">
      {/* TOP BAR */}
      <header className="cbt-topbar">
        <div className="topbar-left">
          <div className="sk-mark">
            <span className="sk-mark-badge">SKCT</span>
            <span>{exam.title}</span>
          </div>

          <div className="subject-stepper">
            {subjects.map((sid, idx) => {
              const meta = SUBJECT_MAP[sid];
              const isActive = idx === subjectIdx;
              const isDone = idx < subjectIdx;
              return (
                <button
                  key={sid}
                  type="button"
                  disabled={config.mode === 'real'}
                  onClick={() => handlePracticeSubjectSwitch(idx)}
                  className={`subject-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''} ${
                    config.mode === 'practice' ? 'clickable' : ''
                  }`}
                >
                  {idx + 1}. {meta.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="topbar-center">
          <div className={`timer-box ${isUrgent ? 'urgent' : isWarning ? 'warning' : ''}`}>
            <span className="timer-label">
              {subjectTimeLimit > 0 ? '남은 시간' : '경과 시간'}
            </span>
            <span className="timer-value">
              {subjectTimeLimit > 0
                ? formatMMSS(secondsLeft)
                : formatMMSS(elapsedPerSubject[currentSubjectId] ?? 0)}
            </span>
            {subjectTimeLimit > 0 && (
              <>
                <span className="timer-total">/ {formatMMSS(subjectTimeLimit)}</span>
                <div className="timer-progress-track">
                  <div
                    className="timer-progress-fill"
                    style={{ width: `${timeProgressPct}%` }}
                  />
                </div>
              </>
            )}
          </div>

          {config.mode === 'practice' && (
            <>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setIsPaused((p) => !p)}
              >
                {isPaused ? '▶ 재개' : '⏸ 일시정지'}
              </button>
              <select
                className="btn btn-outline btn-sm"
                value={subjectTimeLimit / 60}
                onChange={(e) => handlePracticeTimePreset(Number(e.target.value))}
                aria-label="타이머 시간 설정"
              >
                <option value={3}>3분</option>
                <option value={7}>7분</option>
                <option value={10}>10분</option>
                <option value={15}>15분</option>
                <option value={0}>시간 무제한</option>
              </select>
            </>
          )}
        </div>

        <div className="topbar-right">
          <div className="segmented-toggle" title="문제 표시 방식 전환">
            <button
              type="button"
              className={viewMode === 'single' ? 'active' : ''}
              onClick={() => setViewMode('single')}
            >
              한 문제씩
            </button>
            <button
              type="button"
              className={viewMode === 'multi' ? 'active' : ''}
              onClick={() => setViewMode('multi')}
            >
              여러 문제씩
            </button>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setShowHelpModal(true)}
            title="시험 안내"
          >
            ? 안내
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowExitConfirm(true)}
          >
            나가기
          </button>
        </div>
      </header>

      {/* 3-COLUMN WORKSPACE */}
      <div className="cbt-workspace">
        {/* LEFT: OMR & Question Selector */}
        <OmrPanel
          questions={subjectQuestions}
          answers={answers}
          bookmarks={bookmarks}
          currentIndex={questionIndex}
          maxReachedIndex={maxReachedIndex}
          mode={config.mode}
          viewMode={viewMode}
          allowBackInRealSingle={config.allowBackInRealSingle}
          onSelectQuestion={handleJumpOrMoveTo}
          onSelectAnswer={handleSelectAnswer}
          onToggleBookmark={handleToggleBookmark}
          onResetSubjectAnswers={handleResetSubjectAnswers}
          onSubmitSubject={() => setShowSubmitConfirm(true)}
        />

        {/* CENTER: Questions */}
        <main className="question-panel">
          <div className="question-panel-header">
            <div>
              <span className="q-panel-title">
                <span>문제</span>
                <span style={{ color: '#ea002c' }}>{currentMeta.name}</span>
                <span className="q-panel-sub tabular">
                  ({currentMeta.questionCount}문항 · 제한 {currentMeta.timeLimitSeconds / 60}분)
                </span>
              </span>
            </div>

            <div className="q-panel-controls">
              <span style={{ fontSize: '13px', color: '#64748b' }}>글자 크기</span>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setFontSize((f) => Math.max(14, f - 1))}
              >
                가-
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setFontSize((f) => Math.min(22, f + 1))}
              >
                가+
              </button>
            </div>
          </div>

          <div ref={scrollAreaRef} className="question-scroll">
            {viewMode === 'single' ? (
              currentQuestion && (
                <QuestionCard
                  question={currentQuestion}
                  selectedOption={answers[currentQuestion.id] ?? null}
                  bookmarked={!!bookmarks[currentQuestion.id]}
                  mode={config.mode}
                  singleView
                  fontSize={fontSize}
                  showInstantAnswer={!!instantRevealed[currentQuestion.id]}
                  onSelectAnswer={(optIdx) =>
                    handleSelectAnswer(currentQuestion.id, optIdx)
                  }
                  onToggleBookmark={() => handleToggleBookmark(currentQuestion.id)}
                  onToggleInstantAnswer={() =>
                    setInstantRevealed((prev) => ({
                      ...prev,
                      [currentQuestion.id]: !prev[currentQuestion.id],
                    }))
                  }
                />
              )
            ) : (
              subjectQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  onMouseDown={() => setQuestionIndex(idx)}
                >
                  <QuestionCard
                    question={q}
                    selectedOption={answers[q.id] ?? null}
                    bookmarked={!!bookmarks[q.id]}
                    mode={config.mode}
                    singleView={false}
                    fontSize={fontSize}
                    showInstantAnswer={!!instantRevealed[q.id]}
                    onSelectAnswer={(optIdx) => handleSelectAnswer(q.id, optIdx)}
                    onToggleBookmark={() => handleToggleBookmark(q.id)}
                    onToggleInstantAnswer={() =>
                      setInstantRevealed((prev) => ({
                        ...prev,
                        [q.id]: !prev[q.id],
                      }))
                    }
                  />
                </div>
              ))
            )}
          </div>

          <div className="question-footer">
            {viewMode === 'single' ? (
              <>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={
                      questionIndex === 0 ||
                      (config.mode === 'real' && !config.allowBackInRealSingle)
                    }
                    onClick={() => handleJumpOrMoveTo(questionIndex - 1)}
                  >
                    ◀ 이전 문항
                  </button>
                  <span className="tabular" style={{ fontSize: '13px', fontWeight: 700 }}>
                    {questionIndex + 1} / {subjectQuestions.length}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {questionIndex + 1 < subjectQuestions.length ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleJumpOrMoveTo(questionIndex + 1)}
                    >
                      다음 문항 ▶
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setShowSubmitConfirm(true)}
                    >
                      {subjectIdx + 1 < subjects.length ? '다음 영역으로 이동' : '시험 최종 제출'}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <span style={{ fontSize: '12.5px', color: '#718096' }}>
                  좌측 OMR 답안지 번호를 클릭하면 해당 문항으로 바로 이동합니다.
                </span>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowSubmitConfirm(true)}
                >
                  {config.mode === 'practice'
                    ? subjectIdx + 1 < subjects.length
                      ? '다음 영역 / 채점하기'
                      : '전체 채점 및 해설 보기'
                    : subjectIdx + 1 < subjects.length
                      ? `${currentMeta.name} 제출 후 다음 영역`
                      : '최종 답안 제출하기'}
                </button>
              </>
            )}
          </div>
        </main>

        {/* RIGHT: Notepad/Drawing + Calculator */}
        <aside className="tools-panel">
          <ScratchPad clearSignal={clearScratchSignal} />
          <Calculator />
        </aside>
      </div>

      {/* SECTION START READY OVERLAY (Real Mode) */}
      {isReadyOverlay && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#ea002c', marginBottom: '4px' }}>
              제 {subjectIdx + 1} 영역 안내
            </div>
            <h3 className="modal-title">
              {currentMeta.name} ({currentMeta.questionCount}문항 /{' '}
              {currentMeta.timeLimitSeconds / 60}분)
            </h3>
            <div className="modal-body">
              <p style={{ margin: '0 0 8px 0' }}>{currentMeta.description}</p>
              <div
                style={{
                  background: '#f7f8fa',
                  border: '1px solid #d6dce3',
                  borderRadius: '4px',
                  padding: '10px 12px',
                  fontSize: '12.5px',
                }}
              >
                <strong>전략 포인트:</strong> {currentMeta.tips}
              </div>
              {config.mode === 'real' && viewMode === 'single' && !config.allowBackInRealSingle && (
                <p style={{ margin: '10px 0 0 0', color: '#ea002c', fontSize: '12.5px', fontWeight: 600 }}>
                  ※ 실전 한 문제씩 규칙: 다음 문항으로 이동하면 이전 문항으로 되돌아갈 수 없습니다.
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsReadyOverlay(false)}
              >
                {currentMeta.name} 시작하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNANSWERED SKIP CONFIRM MODAL (Strict Single Mode) */}
      {skipConfirmTarget !== null && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3 className="modal-title">미응답 문항 이동 확인</h3>
            <div className="modal-body">
              <p style={{ margin: '0 0 10px 0' }}>
                현재 문항({currentQuestion?.number}번)의 답안을 선택하지 않았습니다.
                건너뛰고 다음 문항으로 이동하시겠습니까?
              </p>
              {!config.allowBackInRealSingle && (
                <p style={{ margin: '0 0 10px 0', color: '#ea002c', fontSize: '12.5px' }}>
                  이동 후에는 이전 문항으로 돌아갈 수 없습니다. (모르는 문제는 감점 방지를 위해 비워두고 넘기는 것이 유리합니다.)
                </p>
              )}
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={suppressSkipConfirm}
                  onChange={(e) => setSuppressSkipConfirm(e.target.checked)}
                />
                <span>이번 시험에서 미응답 이동 경고 다시 묻지 않기</span>
              </label>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setSkipConfirmTarget(null)}
              >
                현재 문항 머무르기
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const target = skipConfirmTarget;
                  setSkipConfirmTarget(null);
                  performSingleMove(target);
                }}
              >
                건너뛰고 이동
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT SUBJECT / EXAM MODAL */}
      {showSubmitConfirm && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3 className="modal-title">
              {subjectIdx + 1 < subjects.length
                ? `${currentMeta.name} 영역을 종료할까요?`
                : '모의고사를 최종 제출하고 채점할까요?'}
            </h3>
            <div className="modal-body">
              현재 영역 응답 수:{' '}
              <strong>
                {
                  subjectQuestions.filter(
                    (q) => answers[q.id] !== undefined && answers[q.id] !== null,
                  ).length
                }{' '}
                / {subjectQuestions.length}문항
              </strong>
              {subjectIdx + 1 < subjects.length && config.mode === 'real' && (
                <p style={{ margin: '8px 0 0 0', fontSize: '12.5px', color: '#ea002c' }}>
                  다음 영역({SUBJECT_MAP[subjects[subjectIdx + 1]].name})으로 넘어가면 현재 영역으로 돌아올 수 없습니다.
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowSubmitConfirm(false)}
              >
                취소
              </button>
              {config.mode === 'practice' && subjectIdx + 1 < subjects.length && (
                <button
                  type="button"
                  className="btn btn-slate"
                  onClick={() => {
                    setShowSubmitConfirm(false);
                    finishExam(elapsedPerSubject);
                  }}
                >
                  바로 전체 채점하기
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setShowSubmitConfirm(false);
                  if (subjectIdx + 1 < subjects.length) {
                    advanceToNextSubject(false);
                  } else {
                    finishExam(elapsedPerSubject);
                  }
                }}
              >
                {subjectIdx + 1 < subjects.length ? '다음 영역으로' : '채점 결과 보기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXIT CONFIRM MODAL */}
      {showExitConfirm && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3 className="modal-title">시험을 중단하고 나가시겠습니까?</h3>
            <div className="modal-body">
              진행 중인 답안은 저장되지 않고 메인 화면으로 돌아갑니다.
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowExitConfirm(false)}
              >
                계속 풀기
              </button>
              <button type="button" className="btn btn-primary" onClick={onExitToLobby}>
                나가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HELP MODAL */}
      {showHelpModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3 className="modal-title">SKCT 온라인 시험 화면 안내</h3>
            <div className="modal-body">
              <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.75 }}>
                <li>
                  <strong>좌측 OMR · 문제선택:</strong> 답안 마킹과 문항 번호 이동(한 문제씩/여러 문제씩)이 가능합니다. 상단 탭으로 접을 수 있습니다.
                </li>
                <li>
                  <strong>메모장 · 그림판:</strong> 마우스로 식을 적거나 메모장 타이핑이 가능하며, 같은 문항 내에서는 탭 전환 시 내용이 유지됩니다.
                </li>
                <li>
                  <strong>계산기:</strong> 계산기 영역을 클릭한 뒤 키보드 숫자 패드와 사칙연산 키(<code>+ - * / Enter Backspace Esc</code>)로 빠르게 계산할 수 있습니다.
                </li>
                <li>
                  <strong>오답 감점 전략:</strong> 선택된 답안을 한 번 더 클릭하면 선택 해제(패스)됩니다.
                </li>
              </ul>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowHelpModal(false)}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
