import { SubjectId, SubjectMeta } from '../types/exam';

export const SUBJECTS: SubjectMeta[] = [
  {
    id: 'verbal_expr',
    order: 1,
    name: '언어표현',
    questionCount: 30,
    timeLimitSeconds: 3 * 60, // 3분 (180초)
    description: '유의어·반의어, 문맥 어휘, 한자성어·속담, 맞춤법 및 어문 규정',
    tips: '문항당 평균 6초입니다. 고민되는 어휘는 과감히 넘기고 즉각 판단 가능한 문항부터 정확히 체크하세요.',
  },
  {
    id: 'verbal_comp',
    order: 2,
    name: '언어이해',
    questionCount: 20,
    timeLimitSeconds: 7 * 60, // 7분 (420초)
    description: '짧은 지문 독해, 핵심 주제 파악, 내용 일치/불일치, 빈칸 추론, 문단 배열',
    tips: '문항당 약 21초입니다. 발문과 선지의 핵심 키워드를 먼저 훑은 뒤 지문에서 근거 문장을 대조하세요.',
  },
  {
    id: 'creative_math',
    order: 3,
    name: '창의수리',
    questionCount: 30,
    timeLimitSeconds: 15 * 60, // 15분 (900초)
    description: '기초 연산, 거속시, 농도(소금물), 일률, 원가·정가, 방정식, 확률·경우의 수, 도형·수열',
    tips: '문항당 30초입니다. 식이 길어지거나 계산이 지저분한 문항은 건너뛰고 확실히 풀 수 있는 문항을 확보하세요.',
  },
  {
    id: 'data_interp',
    order: 4,
    name: '자료해석',
    questionCount: 20,
    timeLimitSeconds: 10 * 60, // 10분 (600초)
    description: '표·그래프 수치 비교, 증감률·비중·평균 계산, ㄱ·ㄴ·ㄷ 진위 판별',
    tips: '문항당 30초입니다. 우측 계산기와 어림셈을 병행하고, 단위(명, %, 억 원, 건 등)를 반드시 확인하세요.',
  },
];

export const SUBJECT_MAP: Record<SubjectId, SubjectMeta> = {
  verbal_expr: SUBJECTS[0],
  verbal_comp: SUBJECTS[1],
  creative_math: SUBJECTS[2],
  data_interp: SUBJECTS[3],
};

export const TOTAL_QUESTIONS = SUBJECTS.reduce((acc, s) => acc + s.questionCount, 0); // 100
export const TOTAL_TIME_SECONDS = SUBJECTS.reduce((acc, s) => acc + s.timeLimitSeconds, 0); // 2100s (35분)
