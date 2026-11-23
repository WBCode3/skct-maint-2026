import React, { useState } from 'react';
import type { ThemeMode } from '../App';
import { SUBJECT_MAP } from '../data/subjects';
import { ExamAttemptRecord, MockExam, SubjectId } from '../types/exam';
import { Calculator } from './Calculator';
import { DataVisual } from './DataVisual';

interface ResultViewProps {
  record: ExamAttemptRecord;
  exam: MockExam;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onBackToLobby: () => void;
}

type ReviewFilter = 'all' | 'wrong' | 'unanswered' | 'bookmarked';

export const ResultView: React.FC<ResultViewProps> = ({
  record,
  exam,
  theme,
  onToggleTheme,
  onBackToLobby,
}) => {
  const [filter, setFilter] = useState<ReviewFilter>('wrong');
  const [subjectFilter, setSubjectFilter] = useState<SubjectId | 'all'>('all');
  const [showCalc, setShowCalc] = useState<boolean>(true);

  const includedSubjects = new Set(record.subjectResults.map((s) => s.subject));
  const examQuestions = exam.questions.filter((q) => includedSubjects.has(q.subject));

  const filteredQuestions = examQuestions.filter((q) => {
    if (subjectFilter !== 'all' && q.subject !== subjectFilter) return false;
    const ans = record.answers[q.id] ?? null;
    if (filter === 'wrong') return ans !== null && ans !== q.answer;
    if (filter === 'unanswered') return ans === null;
    if (filter === 'bookmarked') return !!record.bookmarks[q.id];
    return true;
  });

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}분 ${String(s).padStart(2, '0')}초`;
  };

  return (
    <div className="lobby-page">
      <header className="lobby-header">
        <div className="lobby-header-inner">
          <div className="sk-mark" style={{ fontSize: '16px' }}>
            <span className="sk-mark-badge">SKCT 결과</span>
            <span>{record.mockTitle} · 성적 분석 및 해설</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setShowCalc((prev) => !prev)}
            >
              {showCalc ? '🧮 계산기 숨기기' : '🧮 계산기 열기'}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onToggleTheme}
              title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {theme === 'dark' ? '☀️ 라이트모드' : '🌙 다크모드'}
            </button>
            <button type="button" className="btn btn-primary" onClick={onBackToLobby}>
              메인 화면으로 돌아가기
            </button>
          </div>
        </div>
      </header>

      <main className={`result-container ${showCalc ? 'with-calc' : ''}`}>
        <div className="result-main">
          <div className="result-kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">총 정답 문항</div>
              <div className="kpi-value sk">
                {record.totalCorrect} / {record.totalQuestions}
              </div>
              <div className="kpi-sub">
                정답률 {Math.round((record.totalCorrect / Math.max(record.totalQuestions, 1)) * 100)}%
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">오답 감점 반영 환산점수</div>
              <div className="kpi-value">{record.estimatedNetScore.toFixed(2)}</div>
              <div className="kpi-sub">모의 기준: 정답 +1 / 오답 -0.25 / 미응답 0</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">응답 분포 (정답 / 오답 / 패스)</div>
              <div className="kpi-value" style={{ fontSize: '19px' }}>
                {record.totalCorrect} /{' '}
                <span style={{ color: 'var(--danger)' }}>{record.totalWrong}</span> /{' '}
                <span style={{ color: 'var(--text-muted)' }}>{record.totalUnanswered}</span>
              </div>
              <div className="kpi-sub">
                {record.mode === 'real' ? '실전 모드' : '연습 모드'} ·{' '}
                {record.viewMode === 'single' ? '한 문제씩' : '여러 문제씩'}
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">총 소요 시간</div>
              <div className="kpi-value" style={{ fontSize: '21px' }}>
                {formatTime(record.totalTimeSpentSeconds)}
              </div>
              <div className="kpi-sub">
                {new Date(record.completedAt).toLocaleString('ko-KR')}
              </div>
            </div>
          </div>

          {/* Subject breakdown */}
          <section className="panel-box" style={{ marginBottom: '20px' }}>
            <h2 className="panel-heading">영역별 성적 상세</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="history-table">
              <thead>
                <tr>
                  <th>영역</th>
                  <th>문항 수</th>
                  <th>응답</th>
                  <th>정답</th>
                  <th>오답</th>
                  <th>미응답(패스)</th>
                  <th>정답률</th>
                  <th>소요 시간 / 제한 시간</th>
                  <th>문항당 평균 (권장)</th>
                </tr>
              </thead>
              <tbody>
                {record.subjectResults.map((sr) => {
                  const meta = SUBJECT_MAP[sr.subject];
                  const acc = Math.round((sr.correct / Math.max(sr.total, 1)) * 100);
                  const recSec = Math.round(meta.timeLimitSeconds / Math.max(meta.questionCount, 1));
                  const avgAllSec = sr.total > 0 ? sr.timeSpentSeconds / sr.total : 0;
                  const avgAnsweredSec =
                    sr.answered > 0 ? sr.timeSpentSeconds / sr.answered : null;
                  const paceColor =
                    sr.timeSpentSeconds === 0
                      ? 'var(--text-muted)'
                      : avgAllSec <= recSec
                        ? 'var(--success)'
                        : avgAllSec <= recSec * 1.25
                          ? 'var(--sk-orange-text)'
                          : 'var(--danger)';

                  return (
                    <tr key={sr.subject}>
                      <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{meta.name}</td>
                      <td className="tabular">{sr.total}</td>
                      <td className="tabular">{sr.answered}</td>
                      <td className="tabular" style={{ color: 'var(--success)', fontWeight: 700 }}>
                        {sr.correct}
                      </td>
                      <td className="tabular" style={{ color: 'var(--danger)' }}>
                        {sr.wrong}
                      </td>
                      <td className="tabular">{sr.unanswered}</td>
                      <td className="tabular" style={{ fontWeight: 700 }}>
                        {acc}%
                      </td>
                      <td className="tabular" style={{ whiteSpace: 'nowrap' }}>
                        {formatTime(sr.timeSpentSeconds)} / {meta.timeLimitSeconds / 60}분
                      </td>
                      <td className="tabular" style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ color: paceColor, fontWeight: 800 }}>
                          {avgAllSec.toFixed(1)}초
                        </span>{' '}
                        <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                          (권장 {recSec}초)
                        </span>
                        {avgAnsweredSec !== null && sr.answered !== sr.total && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            응답 문항 기준 {avgAnsweredSec.toFixed(1)}초
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {record.subjectResults.length > 1 && (() => {
                  const sumTotal = record.subjectResults.reduce((a, r) => a + r.total, 0);
                  const sumAnswered = record.subjectResults.reduce((a, r) => a + r.answered, 0);
                  const sumCorrect = record.subjectResults.reduce((a, r) => a + r.correct, 0);
                  const sumWrong = record.subjectResults.reduce((a, r) => a + r.wrong, 0);
                  const sumUnanswered = record.subjectResults.reduce((a, r) => a + r.unanswered, 0);
                  const sumSpent = record.subjectResults.reduce((a, r) => a + r.timeSpentSeconds, 0);
                  const sumLimit = record.subjectResults.reduce((a, r) => a + r.timeLimitSeconds, 0);
                  const totalAcc = Math.round((sumCorrect / Math.max(sumTotal, 1)) * 100);
                  const totalAvg = sumTotal > 0 ? sumSpent / sumTotal : 0;
                  const totalRec = Math.round(sumLimit / Math.max(sumTotal, 1));
                  const totalPaceColor =
                    sumSpent === 0
                      ? 'var(--text-muted)'
                      : totalAvg <= totalRec
                        ? 'var(--success)'
                        : totalAvg <= totalRec * 1.25
                          ? 'var(--sk-orange-text)'
                          : 'var(--danger)';

                  return (
                    <tr style={{ background: 'var(--bg-elevated)', fontWeight: 700 }}>
                      <td style={{ whiteSpace: 'nowrap' }}>합계 / 평균</td>
                      <td className="tabular">{sumTotal}</td>
                      <td className="tabular">{sumAnswered}</td>
                      <td className="tabular" style={{ color: 'var(--success)' }}>
                        {sumCorrect}
                      </td>
                      <td className="tabular" style={{ color: 'var(--danger)' }}>
                        {sumWrong}
                      </td>
                      <td className="tabular">{sumUnanswered}</td>
                      <td className="tabular">{totalAcc}%</td>
                      <td className="tabular" style={{ whiteSpace: 'nowrap' }}>
                        {formatTime(sumSpent)} / {sumLimit / 60}분
                      </td>
                      <td className="tabular" style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ color: totalPaceColor, fontWeight: 800 }}>
                          {totalAvg.toFixed(1)}초
                        </span>{' '}
                        <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          (권장 {totalRec}초)
                        </span>
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </section>

        {/* Review & Explanations */}
        <section className="panel-box">
          <h2 className="panel-heading">
            <span>문항별 오답노트 · 해설 보기</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              표시 중: {filteredQuestions.length}문항
            </span>
          </h2>

          <div className="review-filters">
            <div className="filter-pills">
              {(
                [
                  ['wrong', `오답만 (${record.totalWrong})`],
                  ['unanswered', `미응답 (${record.totalUnanswered})`],
                  ['bookmarked', '별표 표시'],
                  ['all', `전체 (${record.totalQuestions})`],
                ] as [ReviewFilter, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`filter-pill ${filter === key ? 'active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="filter-pills">
              <button
                type="button"
                className={`filter-pill ${subjectFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSubjectFilter('all')}
              >
                전 영역
              </button>
              {record.subjectResults.map((sr) => (
                <button
                  key={sr.subject}
                  type="button"
                  className={`filter-pill ${subjectFilter === sr.subject ? 'active' : ''}`}
                  onClick={() => setSubjectFilter(sr.subject)}
                >
                  {SUBJECT_MAP[sr.subject].name}
                </button>
              ))}
            </div>
          </div>

          {filteredQuestions.length === 0 ? (
            <div
              style={{
                padding: '32px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '13.5px',
              }}
            >
              선택한 조건에 해당하는 문항이 없습니다.
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const userAns = record.answers[q.id] ?? null;
              const isCorrect = userAns === q.answer;
              const meta = SUBJECT_MAP[q.subject];

              return (
                <div key={q.id} className="question-card">
                  <div className="q-stem-header">
                    <div className="q-stem-main" style={{ fontSize: '15px' }}>
                      <span className="q-num-badge">
                        {meta.name} {String(q.number).padStart(2, '0')}
                      </span>
                      <span>{q.prompt}</span>
                    </div>
                    <span
                      className="q-subtype-tag"
                      style={{
                        color:
                          userAns === null
                            ? 'var(--text-muted)'
                            : isCorrect
                              ? 'var(--success)'
                              : 'var(--danger)',
                        borderColor:
                          userAns === null
                            ? 'var(--border-color)'
                            : isCorrect
                              ? 'var(--success-border)'
                              : 'var(--danger-border)',
                        background:
                          userAns === null
                            ? 'var(--bg-subtle)'
                            : isCorrect
                              ? 'var(--success-soft)'
                              : 'var(--danger-soft)',
                      }}
                    >
                      {userAns === null
                        ? '미응답 (패스)'
                        : isCorrect
                          ? '정답'
                          : `오답 (내 답: ${userAns + 1}번)`}
                    </span>
                  </div>

                  {q.passage && <div className="q-passage">{q.passage}</div>}
                  {(q.table || q.chart) && <DataVisual table={q.table} chart={q.chart} />}
                  {q.bogi && q.bogi.length > 0 && (
                    <div className="q-bogi">
                      <div className="q-bogi-title">&lt; 보 기 &gt;</div>
                      {q.bogi.map((item, i) => (
                        <div key={i} className="q-bogi-item">
                          {item}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="q-options">
                    {q.options.map((opt, idx) => {
                      let cls = 'q-option';
                      if (idx === q.answer) cls += ' correct';
                      else if (idx === userAns) cls += ' wrong';
                      return (
                        <div key={idx} className={cls} style={{ cursor: 'default' }}>
                          <span className="q-opt-num">{idx + 1}</span>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="q-explanation-box">
                    <strong>정답 {q.answer + 1}번</strong> · {q.explanation}
                  </div>
                </div>
              );
            })
          )}
          </section>
        </div>

        {showCalc && (
          <aside className="result-calc-sidebar" aria-label="오답 복습용 계산기">
            <Calculator />
            <div className="result-calc-tip">
              계산기 영역을 클릭하면 키보드 숫자·사칙연산 키로 바로 계산할 수 있습니다.
            </div>
          </aside>
        )}
      </main>
    </div>
  );
};
