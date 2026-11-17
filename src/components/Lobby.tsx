import React, { useState } from 'react';
import { SUBJECTS, TOTAL_QUESTIONS, TOTAL_TIME_SECONDS } from '../data/subjects';
import {
  ExamAttemptRecord,
  ExamConfig,
  ExamMode,
  MockExam,
  SubjectId,
  ViewMode,
} from '../types/exam';

interface LobbyProps {
  exams: MockExam[];
  history: ExamAttemptRecord[];
  onStartExam: (config: ExamConfig) => void;
  onViewHistoryResult: (record: ExamAttemptRecord) => void;
  onClearHistory: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  exams,
  history,
  onStartExam,
  onViewHistoryResult,
  onClearHistory,
}) => {
  const [selectedMockId, setSelectedMockId] = useState<number>(1);
  const [mode, setMode] = useState<ExamMode>('real');
  const [viewMode, setViewMode] = useState<ViewMode>('multi');
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectId[]>(
    SUBJECTS.map((s) => s.id),
  );
  const [allowBackInRealSingle, setAllowBackInRealSingle] = useState<boolean>(false);
  const [autoClearScratchOnNext, setAutoClearScratchOnNext] = useState<boolean>(true);
  const [practiceNoTimer, setPracticeNoTimer] = useState<boolean>(false);

  const toggleSubject = (id: SubjectId) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least 1
        return prev.filter((item) => item !== id);
      }
      // Keep canonical order
      const next = [...prev, id];
      return SUBJECTS.map((s) => s.id).filter((sid) => next.includes(sid));
    });
  };

  const getLatestScoreForMock = (mockId: number) => {
    const found = history.find((h) => h.mockId === mockId);
    return found ?? null;
  };

  const handleStart = () => {
    const subjectsToRun =
      mode === 'real' ? SUBJECTS.map((s) => s.id) : selectedSubjects;

    onStartExam({
      mockId: selectedMockId,
      mode,
      viewMode,
      selectedSubjects: subjectsToRun,
      allowBackInRealSingle: mode === 'real' ? allowBackInRealSingle : true,
      autoClearScratchOnNext,
      customTimeMultiplier: mode === 'practice' && practiceNoTimer ? 0 : 1,
    });
  };

  return (
    <div className="lobby-page">
      <header className="lobby-header">
        <div className="lobby-header-inner">
          <div className="sk-mark" style={{ fontSize: '18.5px' }}>
            <span className="sk-mark-badge">SKCT</span>
            <span>SK하이닉스 메인터넌스 · 오퍼레이터 온라인 모의고사</span>
          </div>
          <div style={{ fontSize: '13.5px', color: '#4a5568', fontWeight: 600 }}>
            고졸 · 초대졸(생산직) 인지역량 실전 대비
          </div>
        </div>
      </header>

      <main className="lobby-container">
        <div className="lobby-summary-strip">
          <div>
            <div style={{ fontSize: '15.5px', fontWeight: 800, marginBottom: '5px' }}>
              실제 시험 출제 구성 (인지역량 4개 영역 · {TOTAL_QUESTIONS}문항 · 35분 · 5지선다)
            </div>
            <div style={{ fontSize: '13.5px', color: '#64748b' }}>
              언어표현은 6초/문항의 극심한 타임어택이며, 수리·자료는 화면 내 계산기/그림판을 활용해 정확도를 높여야 합니다.
            </div>
          </div>
          <div className="spec-pills">
            {SUBJECTS.map((s) => {
              const secPerQ = Math.round(s.timeLimitSeconds / s.questionCount);
              return (
                <div key={s.id} className="spec-pill tabular">
                  <strong>{s.name}</strong> {s.questionCount}문항 / {s.timeLimitSeconds / 60}분{' '}
                  <span style={{ color: '#ea002c', fontWeight: 700 }}>(문항당 {secPerQ}초)</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lobby-grid">
          {/* Left: 5 Mock Exams */}
          <section className="panel-box">
            <h2 className="panel-heading">
              <span>1. 모의고사 회차 선택 (총 5회분 · 500문항)</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                회차별 100문항
              </span>
            </h2>

            <div className="mock-list">
              {exams.map((exam) => {
                const latest = getLatestScoreForMock(exam.id);
                const isSelected = selectedMockId === exam.id;
                return (
                  <button
                    key={exam.id}
                    type="button"
                    className={`mock-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedMockId(exam.id)}
                  >
                    <div>
                      <div className="mock-item-title">{exam.title}</div>
                      <div className="mock-item-sub">{exam.subtitle}</div>
                    </div>
                    <div className="mock-item-meta tabular">
                      {latest ? (
                        <>
                          <div style={{ color: '#ea002c' }}>
                            최근 {latest.totalCorrect}/{latest.totalQuestions}문항
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {latest.mode === 'real' ? '실전' : '연습'} ·{' '}
                            {new Date(latest.completedAt).toLocaleDateString('ko-KR')}
                          </div>
                        </>
                      ) : (
                        <span style={{ color: '#64748b' }}>미응시 · 100문항</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Right: Mode & Options */}
          <section className="panel-box">
            <h2 className="panel-heading">2. 응시 환경 설정</h2>

            <div className="config-group">
              <span className="config-label">응시 모드</span>
              <div className="choice-grid-2">
                <button
                  type="button"
                  className={`choice-btn ${mode === 'real' ? 'selected' : ''}`}
                  onClick={() => setMode('real')}
                >
                  <div className="choice-btn-title">실전 모드</div>
                  <div className="choice-btn-desc">
                    영역별 자동 타이머(3·7·15·10분) 적용, 시간 종료 시 자동 전환
                  </div>
                </button>
                <button
                  type="button"
                  className={`choice-btn ${mode === 'practice' ? 'selected' : ''}`}
                  onClick={() => setMode('practice')}
                >
                  <div className="choice-btn-title">연습 모드</div>
                  <div className="choice-btn-desc">
                    원하는 영역 선택, 타이머 일시정지/해제, 즉시 정답·해설 확인
                  </div>
                </button>
              </div>
            </div>

            <div className="config-group">
              <span className="config-label">문제 보기 방식</span>
              <div className="choice-grid-2">
                <button
                  type="button"
                  className={`choice-btn ${viewMode === 'multi' ? 'selected' : ''}`}
                  onClick={() => setViewMode('multi')}
                >
                  <div className="choice-btn-title">여러 문제씩 보기</div>
                  <div className="choice-btn-desc">
                    한 영역의 여러 문항 스크롤 + 좌측 OMR/문제선택 자유 이동
                  </div>
                </button>
                <button
                  type="button"
                  className={`choice-btn ${viewMode === 'single' ? 'selected' : ''}`}
                  onClick={() => setViewMode('single')}
                >
                  <div className="choice-btn-title">한 문제씩 보기</div>
                  <div className="choice-btn-desc">
                    실제 온라인 SKCT 화면처럼 한 화면에 1문항 집중 표시
                  </div>
                </button>
              </div>
            </div>

            {mode === 'practice' ? (
              <div className="config-group">
                <span className="config-label">연습 영역 선택</span>
                <div className="subject-check-grid">
                  {SUBJECTS.map((s) => {
                    const checked = selectedSubjects.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`subject-check ${checked ? 'checked' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSubject(s.id)}
                        />
                        <span>
                          {s.name} ({s.questionCount}문항)
                        </span>
                      </label>
                    );
                  })}
                </div>
                <label className="checkbox-row" style={{ marginTop: '10px' }}>
                  <input
                    type="checkbox"
                    checked={practiceNoTimer}
                    onChange={(e) => setPracticeNoTimer(e.target.checked)}
                  />
                  <span>시간 제한 없이 풀기 (해제 시 실전 시간 타이머 작동)</span>
                </label>
              </div>
            ) : (
              <div className="config-group">
                <span className="config-label">실전 세부 규칙</span>
                {viewMode === 'single' && (
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={!allowBackInRealSingle}
                      onChange={(e) => setAllowBackInRealSingle(!e.target.checked)}
                    />
                    <span>
                      <strong>이전 문항 돌아가기 불가</strong> (공식 온라인 SKCT 규칙 적용)
                    </span>
                  </label>
                )}
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={autoClearScratchOnNext}
                    onChange={(e) => setAutoClearScratchOnNext(e.target.checked)}
                  />
                  <span>다음 문항 이동 시 메모장 · 그림판 자동 초기화</span>
                </label>
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary start-exam-btn"
              onClick={handleStart}
            >
              제{selectedMockId}회 모의고사 시작하기
            </button>
          </section>
        </div>

        {/* Time pacing & Guidebook Tips */}
        <section className="panel-box" style={{ marginTop: '18px' }}>
          <h2 className="panel-heading">
            <span>영역별 문항당 제한 시간 &amp; 합격 가이드북 SKCT 공략법</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
              가이드북 합격자 후기 기반
            </span>
          </h2>

          <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
            <table className="history-table">
              <thead>
                <tr>
                  <th>영역</th>
                  <th>문항 수</th>
                  <th>제한 시간</th>
                  <th>문항당 평균 시간</th>
                  <th>권장 목표 / 손절 기준</th>
                  <th>영역별 실전 공략 (가이드북 후기)</th>
                </tr>
              </thead>
              <tbody>
                {SUBJECTS.map((s) => {
                  const secPerQ = Math.round(s.timeLimitSeconds / s.questionCount);
                  const strategyMap: Record<
                    SubjectId,
                    { target: string; tip: string }
                  > = {
                    verbal_expr: {
                      target: '4~5초 내 즉각 체크 (10초 초과 시 패스)',
                      tip: '고민할 시간이 없으므로 보자마자 직관적으로 체크. 시간 배분 실수 시 뒷부분 10문항 이상 못 풀고 종료될 수 있음.',
                    },
                    verbal_comp: {
                      target: '18~20초 내 컷 (30초 초과 시 패스)',
                      tip: '다양한 주제의 짧은 지문 출제. 발문과 선지 키워드를 먼저 보고 지문 근거 문장과 1:1 대조.',
                    },
                    creative_math: {
                      target: '25~30초 내 컷 (식 안 세워지면 즉시 패스)',
                      tip: '거속시·소금물·일률·나이·원가정가·경우의 수 등 기초 수학 중심. 암산 가능한 건 암산하고 식 정리는 그림판 활용.',
                    },
                    data_interp: {
                      target: '25~30초 내 컷 (계산 지저분하면 패스)',
                      tip: '화면 계산기 활용 시 난도는 평이하나, 평균·비율 계산 중 항목 하나를 빼먹는 실수를 가장 조심해야 함.',
                    },
                  };
                  const st = strategyMap[s.id];
                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 800 }}>{s.name}</td>
                      <td className="tabular">{s.questionCount}문항</td>
                      <td className="tabular">
                        {s.timeLimitSeconds / 60}분 ({s.timeLimitSeconds}초)
                      </td>
                      <td
                        className="tabular"
                        style={{ color: '#ea002c', fontWeight: 800 }}
                      >
                        문항당 {secPerQ}초
                      </td>
                      <td style={{ fontWeight: 600, color: '#1a202c' }}>
                        {st.target}
                      </td>
                      <td style={{ color: '#4a5568', lineHeight: 1.55 }}>
                        {st.tip}
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td>합계 / 평균</td>
                  <td className="tabular">{TOTAL_QUESTIONS}문항</td>
                  <td className="tabular">
                    {TOTAL_TIME_SECONDS / 60}분 ({TOTAL_TIME_SECONDS.toLocaleString()}초)
                  </td>
                  <td className="tabular" style={{ color: '#ea002c' }}>
                    평균 {Math.round(TOTAL_TIME_SECONDS / TOTAL_QUESTIONS)}초
                  </td>
                  <td colSpan={2} style={{ color: '#4a5568', fontWeight: 600 }}>
                    ※ 합격 후기 기준 100문항 중 90~95문항만 확실히 풀고 모르는 문제는 비워둬도 충분한 합격권입니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '12px',
            }}
          >
            <div
              style={{
                padding: '13px 15px',
                background: '#f8fafc',
                border: '1px solid #d6dce3',
                borderRadius: '6px',
                fontSize: '13.5px',
                lineHeight: 1.65,
              }}
            >
              <div style={{ fontWeight: 800, color: '#1a202c', marginBottom: '6px' }}>
                1. 찍기 금지 · 빠른 패스 전략 (오답 감점 대비)
              </div>
              <div style={{ color: '#4a5568' }}>
                오답 감점 가능성이 있으므로 모르는 문제나 계산이 복잡하고 지저분해 보이는 문제는 찍지 말고 바로 넘기세요. 풀 수 있는 문항의 정답률을 높이는 것이 핵심입니다.
              </div>
            </div>

            <div
              style={{
                padding: '13px 15px',
                background: '#f8fafc',
                border: '1px solid #d6dce3',
                borderRadius: '6px',
                fontSize: '13.5px',
                lineHeight: 1.65,
              }}
            >
              <div style={{ fontWeight: 800, color: '#1a202c', marginBottom: '6px' }}>
                2. 종이 필기 불가 → 눈·그림판·계산기 분업
              </div>
              <div style={{ color: '#4a5568' }}>
                실전에서는 종이·펜을 쓸 수 없습니다. 단순 연산은 계산기보다 암산이 빠르고, 방정식·비례식은 <strong>그림판</strong>, 퍼센트·평균은 <strong>계산기(숫자 키패드)</strong>로 푸는 연습을 해두세요.
              </div>
            </div>

            <div
              style={{
                padding: '13px 15px',
                background: '#f8fafc',
                border: '1px solid #d6dce3',
                borderRadius: '6px',
                fontSize: '13.5px',
                lineHeight: 1.65,
              }}
            >
              <div style={{ fontWeight: 800, color: '#1a202c', marginBottom: '6px' }}>
                3. 대졸 기본서보다 평이 · 사전 프로그램 &amp; 인성 유의
              </div>
              <div style={{ color: '#4a5568' }}>
                생산직 SKCT는 대졸 통합서보다 훨씬 쉬우므로 <strong>빈출 수리 테마</strong> 속도를 높이는 게 유리합니다. 시험 전 SKCT 테스트 앱 구동 확인과 2교시 인성검사의 <strong>일관성 유지</strong>도 반드시 챙기세요.
              </div>
            </div>
          </div>
        </section>

        {/* History table */}
        {history.length > 0 && (
          <section className="panel-box" style={{ marginTop: '18px' }}>
            <div className="panel-heading">
              <span>최근 응시 기록 (오답노트 · 결과 다시보기)</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={onClearHistory}>
                기록 전체 삭제
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="history-table">
                <thead>
                  <tr>
                    <th>응시 일시</th>
                    <th>모의고사</th>
                    <th>모드 / 보기</th>
                    <th>정답</th>
                    <th>오답</th>
                    <th>미응답</th>
                    <th>감점 반영 환산</th>
                    <th>소요 시간</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((rec) => (
                    <tr key={rec.id}>
                      <td className="tabular">
                        {new Date(rec.completedAt).toLocaleString('ko-KR', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td style={{ fontWeight: 700 }}>{rec.mockTitle}</td>
                      <td>
                        {rec.mode === 'real' ? '실전' : '연습'} ·{' '}
                        {rec.viewMode === 'single' ? '한문제씩' : '여러문제씩'}
                      </td>
                      <td className="tabular" style={{ color: '#15803d', fontWeight: 700 }}>
                        {rec.totalCorrect} / {rec.totalQuestions}
                      </td>
                      <td className="tabular" style={{ color: '#dc2626' }}>
                        {rec.totalWrong}
                      </td>
                      <td className="tabular">{rec.totalUnanswered}</td>
                      <td className="tabular" style={{ fontWeight: 700 }}>
                        {rec.estimatedNetScore.toFixed(2)}점
                      </td>
                      <td className="tabular">
                        {Math.floor(rec.totalTimeSpentSeconds / 60)}분{' '}
                        {rec.totalTimeSpentSeconds % 60}초
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => onViewHistoryResult(rec)}
                        >
                          성적표 · 해설
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
