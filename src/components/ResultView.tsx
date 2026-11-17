import React, { useState } from 'react';
import { SUBJECT_MAP } from '../data/subjects';
import { ExamAttemptRecord, MockExam, SubjectId } from '../types/exam';
import { DataVisual } from './DataVisual';

interface ResultViewProps {
  record: ExamAttemptRecord;
  exam: MockExam;
  onBackToLobby: () => void;
}

type ReviewFilter = 'all' | 'wrong' | 'unanswered' | 'bookmarked';

export const ResultView: React.FC<ResultViewProps> = ({
  record,
  exam,
  onBackToLobby,
}) => {
  const [filter, setFilter] = useState<ReviewFilter>('wrong');
  const [subjectFilter, setSubjectFilter] = useState<SubjectId | 'all'>('all');

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
          <button type="button" className="btn btn-primary" onClick={onBackToLobby}>
            메인 화면으로 돌아가기
          </button>
        </div>
      </header>

      <main className="result-container">
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
              <span style={{ color: '#dc2626' }}>{record.totalWrong}</span> /{' '}
              <span style={{ color: '#718096' }}>{record.totalUnanswered}</span>
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
                </tr>
              </thead>
              <tbody>
                {record.subjectResults.map((sr) => {
                  const meta = SUBJECT_MAP[sr.subject];
                  const acc = Math.round((sr.correct / Math.max(sr.total, 1)) * 100);
                  return (
                    <tr key={sr.subject}>
                      <td style={{ fontWeight: 700 }}>{meta.name}</td>
                      <td className="tabular">{sr.total}</td>
                      <td className="tabular">{sr.answered}</td>
                      <td className="tabular" style={{ color: '#15803d', fontWeight: 700 }}>
                        {sr.correct}
                      </td>
                      <td className="tabular" style={{ color: '#dc2626' }}>
                        {sr.wrong}
                      </td>
                      <td className="tabular">{sr.unanswered}</td>
                      <td className="tabular" style={{ fontWeight: 700 }}>
                        {acc}%
                      </td>
                      <td className="tabular">
                        {formatTime(sr.timeSpentSeconds)} / {meta.timeLimitSeconds / 60}분
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Review & Explanations */}
        <section className="panel-box">
          <h2 className="panel-heading">
            <span>문항별 오답노트 · 해설 보기</span>
            <span style={{ fontSize: '12px', color: '#718096' }}>
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
                color: '#718096',
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
                            ? '#718096'
                            : isCorrect
                              ? '#15803d'
                              : '#dc2626',
                        borderColor:
                          userAns === null
                            ? '#d6dce3'
                            : isCorrect
                              ? '#86efac'
                              : '#fca5a5',
                        background:
                          userAns === null
                            ? '#f7f8fa'
                            : isCorrect
                              ? '#f0fdf4'
                              : '#fef2f2',
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
      </main>
    </div>
  );
};
