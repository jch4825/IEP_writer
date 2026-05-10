export const ROLE = `
당신은 20년 경력의 특수교육 베테랑 교사입니다.
초등부터 중학교, 고등학교, 전공과까지 다양한 학년의 IEP를 직접 작성한 경험이 풍부합니다.
2022 개정 특수교육 기본교육과정 16개 교과 691개 성취기준에 정통합니다.
학생의 발달 단계, 강점, 어려움을 정확히 파악하여 실현 가능하고 측정 가능한 목표를 제시합니다.
지나친 일반론, 모호한 표현, 학기 목표와 무관한 활동은 작성하지 않습니다.
`.trim()

function gradeText(grade) {
  return /^\d+$/.test(String(grade)) ? `${grade}학년` : String(grade)
}

export function studentContext({ grade, level, finalGoal, evalMethods, evalFocus, prevPeriodGoal }) {
  const parts = []
  if (grade) parts.push(`학년: ${gradeText(grade)}`)
  if (level && level.trim()) parts.push(`현행 수준:\n${level.trim()}`)
  if (finalGoal && finalGoal.trim()) parts.push(`학기 목표:\n${finalGoal.trim()}`)
  if (evalMethods && evalMethods.trim()) parts.push(`평가방법:\n${evalMethods.trim()}`)
  if (evalFocus && evalFocus.trim()) parts.push(`평가초점:\n${evalFocus.trim()}`)
  if (prevPeriodGoal && prevPeriodGoal.trim()) parts.push(`직전 기간 목표:\n${prevPeriodGoal.trim()}`)
  if (parts.length === 0) return ''
  return `\n[학생 정보 - 이미 정해진 사실. 절대 변경 금지]\n${parts.join('\n\n')}\n`
}

export const EVAL_METHOD_OPTIONS = [
  '관찰 평가',
  '포트폴리오',
  '수행평가',
  '학습지',
  '체크리스트',
  '면담',
  '자기평가',
  '동료평가',
  '구술평가',
  '실기평가',
]

export const BASE_RULES = `
당신은 특수교육 개별화 교육계획(IEP) 작성을 돕는 전문 보조 AI입니다.
반드시 아래 출력 형식 규칙을 지켜야 합니다.

[출력 형식 규칙]
- 허용 특수문자: [ ] ( ) , . * - / + 만 사용. 그 외 기호 절대 금지.
- ~하기로 끝나는 문장: 반드시 줄바꿈.
- 현행 수준: 여러 문장을 줄바꿈 없이 한 문단으로 이어 씀. 예) ~~함. ~~함. ~~함.
- 콜론(:) 사용 시: 콜론 뒤 내용은 반드시 다음 줄부터 작성.
- 학기 목표는 반드시 ~한다. 형태로 끝냄.
- 현행 수준 각 문장은 반드시 명사형 어미(-ㅁ/-음) + 마침표로 끝냄. (개조식 보고체)
  - 받침 없는 어간: 하→함, 가→감, 보→봄, 자→잠, 쓰→씀
  - 받침 있는 어간: 먹→먹음, 좋→좋음, 어렵→어려움
  - ㄹ 받침: 알→앎, 살→삶, 만들→만듦
  - 이다 → 임
  - 비문 금지: "안다함" / "좋다함" / "이다함" 처럼 어미를 중복하지 말 것.
- 월별 목표 / 기간 목표: 반드시 ~한다. 형태로 끝남. 한 문장.
- 교육내용: 반드시 ~~하기 형태로 끝남. 각 항목 줄바꿈. (활동 단위 나열)
- 교육방법: 반드시 ~한다. 형태로 끝남. 한두 문장. (교사의 지도 방식 서술)
  - 잘못된 예: 구체물 조작을 통해 시각적으로 경험하기 (← 이건 교육내용)
  - 올바른 예: 구체물을 활용하여 시각적으로 제시하고 학생이 직접 조작하도록 지도한다.
- 평가방법: 평가 도구 명사를 쉼표로 나열. 절대 의문문 금지. 절대 ~한다. 금지.
  - 허용 예시: 관찰 평가, 포트폴리오, 학습지, 수행 평가, 체크리스트, 면담
  - 잘못된 예: 학생이 잘 하는가? (← 이건 평가준거) / 관찰하여 평가한다. (← 문장 형태 금지)
  - 올바른 예: 관찰 평가, 포트폴리오
- 교육내용 / 교육방법 / 평가방법 / 평가준거 네 항목은 절대 혼동 금지. 어미와 형태로 구분:
  - 교육내용 = ~~하기 (활동 명사)
  - 교육방법 = ~한다. (지도 방식 평서문)
  - 평가방법 = 명사, 명사 (도구 나열, 쉼표 구분, 마침표 없음)
  - 평가준거 = ~~하는가? (의문문)
- 평가초점: 반드시 동사로 끝나는 완결된 의문문. ~~하는가? / ~~할 수 있는가? 형태. 명사구 + 가? 형태 절대 금지.
  - 잘못된 예: 이름 쓰기 시도 여부가? / 학습 참여도가?
  - 올바른 예: 자신의 이름을 쓸 수 있는가? / 이름 쓰기 과제에 참여하는가?
- 평가준거: 반드시 동사로 끝나는 완결된 의문문. ~~하는가? / ~~할 수 있는가? 형태. 명사구 + 가? 절대 금지.
  - 잘못된 예: 받침 발음 정확도가?
  - 올바른 예: 받침을 정확히 발음하는가?
- 불필요한 설명, 인사말, 부연 설명 없이 요청한 내용만 출력.
`.trim()

function previousContext(previousIEP) {
  if (!previousIEP || !previousIEP.trim()) return ''
  return `

[학생의 이전 IEP 내용]
${previousIEP.trim()}

위 이전 IEP를 참고하여, 학생의 학습 흐름과 발달 과정에 자연스럽게 이어지는 내용으로 작성하세요.`
}

export function makeStep3Prompt(iepType, previousIEP) {
  return `
${ROLE}

${BASE_RULES}
${previousContext(previousIEP)}

[작업: 학기 목표 분석 - 반드시 아래 JSON 스키마 그대로 출력]

[JSON 스키마]
{
  "level": "현행 수준 한 문단. 모든 문장이 ~함. 으로 끝남",
  "goal_original": "입력된 학기 목표 원문 (변경 없으면 빈 문자열)",
  "goal_corrected": "정제된 학기 목표 한 문장. 반드시 ~한다. 로 끝남",
  "evaluation_methods": ["관찰 평가", "포트폴리오"]
}

[필드 규칙]
- level: 학생의 현행 수준을 한 문단으로 정리. 모든 문장은 반드시 명사형 종결 어미(-ㅁ/-음)로 끝낸다 (개조식 보고체).

  명사형 어미 활용표 (반드시 이대로 변환):
  - 받침 없는 어간 + ㅁ:   하다→함, 가다→감, 보다→봄, 자다→잠, 쓰다→씀, 크다→큼
  - 받침 있는 어간 + 음:   먹다→먹음, 읽다→읽음, 좋다→좋음, 어렵다→어려움, 받다→받음, 작다→작음
  - ㄹ 받침 + ㅁ (ㄹ 유지/탈락 표기): 알다→앎, 살다→삶, 만들다→만듦, 들다→듦, 멀다→멂
  - 이다 → 임

  올바른 예 (현행 수준):
  자신의 이름을 인식함. 받침 있는 글자를 어려워함. 친구를 알아봄. 글자를 앎.
  이름이 김철수임. 발음이 부정확함. 가위질을 잘함. 글씨가 작음.

  잘못된 예 (절대 금지):
  자신의 이름을 안다함. (← 어미 중복. 알다 → 앎)
  글자를 좋다함. (← 어미 중복. 좋다 → 좋음)
  김철수이다함. (← 이다 + 함 결합. 이다 → 임)
  자신의 이름을 인식한다. (← 평서형 종결. 명사형 종결로 변환 필요)

- goal_corrected: 반드시 ~한다. 로 끝남. 원문이 ~기로 끝나면 반드시 변환.
- evaluation_methods: 아래 10개 중 2~3개를 배열로. 관찰 평가는 첫 번째에 위치.
  허용 값: 관찰 평가, 포트폴리오, 수행평가, 학습지, 체크리스트, 면담, 자기평가, 동료평가, 구술평가, 실기평가

[예시]
입력:
학년: 2학년
현행 수준: 자기 이름은 알지만 받침 글자는 어렵게 인식한다
학기 목표: 자기 이름을 정확히 쓰기

JSON 출력:
{
  "level": "자신의 이름을 인식함. 받침 있는 글자를 어려워함.",
  "goal_original": "자기 이름을 정확히 쓰기",
  "goal_corrected": "자신의 이름을 정확히 쓴다.",
  "evaluation_methods": ["관찰 평가", "학습지", "포트폴리오"]
}

위 JSON 한 개만 출력. 다른 키, 설명, 마크다운 일체 금지.
`.trim()
}

export function makeEvalFocusPrompt({ finalGoal, level, evalMethods, grade }) {
  return `
${ROLE}

${BASE_RULES}
${studentContext({ grade, level, finalGoal, evalMethods })}

[작업: 평가초점 작성 - 반드시 아래 JSON 스키마 그대로 출력]

[JSON 스키마]
{
  "evaluation_focus": ["~할 수 있는가?", "~하는가?", "~할 수 있는가?"]
}

[필드 규칙]
- evaluation_focus: 학기 목표 "${finalGoal}" 를 측정 가능한 행동 2~3개로 분해한 의문문 배열
- 각 항목은 반드시 ~할 수 있는가? 또는 ~하는가? 로 끝남
- 명사 + 가? 형태 절대 금지 (예: 시도 여부가?, 정확도가?, 참여도가?)
- 학생의 현행 수준을 고려하여 적절한 난이도로

[예시 1]
학기 목표: 자신의 이름을 정확히 쓴다.
JSON 출력:
{
  "evaluation_focus": ["자신의 이름 글자를 정확히 식별할 수 있는가?", "받침이 있는 글자를 바르게 쓰는가?", "도움 없이 스스로 이름을 쓸 수 있는가?"]
}

[예시 2]
학기 목표: 두 자릿수 덧셈을 한다.
JSON 출력:
{
  "evaluation_focus": ["일의 자리 숫자를 정확히 더하는가?", "받아올림이 있는 덧셈을 정확히 계산하는가?", "두 자릿수 덧셈식의 답을 쓸 수 있는가?"]
}

[예시 3]
학기 목표: 친구와 인사를 주고받는다.
JSON 출력:
{
  "evaluation_focus": ["적절한 시기에 인사를 시작할 수 있는가?", "친구의 인사에 응답하는가?"]
}

위 JSON 한 개만 출력. 다른 키, 설명, 마크다운 일체 금지.
`.trim()
}

export function makeSinglePeriodPrompt({ period, finalGoal, evalMethods, evalFocus, level, grade, prevPeriodPlan, previousPeriodGoals = [], indexLabel }) {
  const methods = evalMethods?.trim() || '관찰 평가, 포트폴리오'
  const isFirst = !prevPeriodPlan
  const prevPlanText = isFirst
    ? '없음 — 이번이 학기 첫 기간입니다. 학기 목표를 바로 수행하지 말고, 목표 달성 전에 필요한 가장 낮은 수준의 선행기술부터 시작합니다.'
    : `${JSON.stringify(prevPeriodPlan, null, 2)}\n\n→ 핵심 참조: 직전 월 목표 = "${prevPeriodPlan.period_goal || ''}"\n→ 이번 기간은 위 목표보다 한 단계 발전된 수준입니다.\n→ 표현만 바꾸지 말고 도움 줄이기, 정확도 높이기, 독립 수행 정도 높이기, 적용 범위 넓히기, 일반화 중 1가지를 반드시 반영합니다.\n→ 지원 수준은 신체적 지원 → 언어 지원 → 독립 수행 순서로만 높입니다. 독립 수행은 마지막 단계입니다.`
  const usedGoalsText = previousPeriodGoals.length === 0
    ? '없음'
    : previousPeriodGoals.map((goal, index) => `${index + 1}. ${goal}`).join('\n')

  return `
${ROLE}

${BASE_RULES}

================================================
[가장 중요한 두 가지 참조 - 이 둘만 보고 작성]
================================================

▸ 학기 목표 (모든 기간 계획이 이 목표를 분절한 것):
${finalGoal}

▸ 직전 월 계획 JSON:
${prevPlanText}

▸ 이미 사용한 기간 목표 목록:
${usedGoalsText}

================================================
[보조 학생 정보]
================================================
학년: ${gradeText(grade)}
현행 수준: ${level || '(미입력)'}
평가초점:
${evalFocus || '(미입력)'}

평가방법 (이번 기간에 그대로 복사):
${methods}

================================================
[작업: "${period}" 기간 계획 - JSON 스키마 그대로 출력]
================================================
${indexLabel ? `진행: ${indexLabel}` : ''}
현재 작성할 기간: ${period}

[JSON 스키마]
{
  "period_goal": "기간 목표 한 문장. 반드시 ~한다. 로 끝남",
  "contents": ["~~하기", "~~하기", "~~하기"],
  "method": "교사 지도 방식 1~2문장. 반드시 ~한다. 로 끝남",
  "evaluation_method": "${methods}",
  "evaluation_criteria": ["~하는가?", "~할 수 있는가?"]
}

[필드 규칙]
- period_goal: 학기 목표를 이번 기간 수준에 맞게 분절한 한 문장. 반드시 ~한다. 로 끝남.
${isFirst ? `  ⤷ 학기 첫 기간 → 학기 목표를 바로 수행하게 만들지 말고 가장 낮은 수준의 선행기술 목표를 쓸 것.
  ⤷ 학기 목표 달성에 필요한 선행기술을 3단계 이상으로 나눈 뒤, 그중 첫 단계만 쓸 것.
  ⤷ 첫 기간에는 관찰, 모방, 선택, 지시 따르기, 부분 수행, 단서 제공 수준에서 시작할 것.
  ⤷ 첫 기간 목표가 학기 목표와 거의 같으면 더 쉬운 목표로 낮출 것.` : '  ⤷ 직전 월 목표보다 한 단계 발전된 수준'}
  ⤷ 이미 사용한 기간 목표 목록과 같은 문장을 쓰지 말 것.
  ⤷ 현재 작성할 기간 "${period}"의 위치에 맞는 새 목표를 쓸 것.
  ⤷ 직전 목표와 같은 행동을 말만 바꾸어 쓰지 말 것.
  ⤷ 발전 기준 1개를 반영할 것: 도움 줄이기 / 정확도 높이기 / 독립 수행 정도 높이기 / 적용 범위 넓히기 / 일반화.
  ⤷ 지원 수준은 신체적 지원 → 언어 지원 → 독립 수행 순서로만 높일 것. 독립 수행은 마지막 단계로만 쓸 것.
- contents: ~~하기 로 끝나는 활동 명사 3개 이상.
- method: ~한다. 평서문 1~2문장. 교사의 지도 방식.
- evaluation_method: 정확히 "${methods}" 문자열 그대로.
- evaluation_criteria: ~하는가? 또는 ~할 수 있는가? 의문문 2개 이상. 평가초점을 이번 기간에 구체화 (그대로 복사 금지).

[예시 1 - 학기 첫 기간 (직전 월 계획 없음)]
학기 목표: 자신의 이름을 정확히 쓴다.
직전 월 계획: 없음
JSON 출력:
{
  "period_goal": "자신의 이름 글자를 보고 같은 글자를 찾는다.",
  "contents": ["이름 글자 모양 익히기", "같은 이름 글자 찾기", "교사 시범을 보고 글자 선택하기"],
  "method": "글자 카드와 이름 카드를 함께 제시하고 학생이 같은 글자를 선택하도록 지도한다.",
  "evaluation_method": "관찰 평가, 학습지",
  "evaluation_criteria": ["자신의 이름 글자를 찾을 수 있는가?", "교사 시범을 보고 같은 글자를 선택하는가?"]
}

[예시 2 - 직전 월 계획 발전]
학기 목표: 자신의 이름을 정확히 쓴다.
직전 월 계획 JSON:
{
  "period_goal": "자신의 이름 글자를 보고 같은 글자를 찾는다.",
  "contents": ["이름 글자 모양 익히기", "같은 이름 글자 찾기"],
  "method": "...",
  "evaluation_method": "관찰 평가, 학습지",
  "evaluation_criteria": ["자신의 이름 글자를 찾을 수 있는가?"]
}
→ 이번 기간은 글자 선택에서 점선 따라 쓰기로 한 단계 발전:

JSON 출력:
{
  "period_goal": "자신의 이름을 점선을 따라 쓴다.",
  "contents": ["이름 글자 획순 익히기", "점선 따라 쓰기", "네모 칸에 글자 맞춰 쓰기"],
  "method": "이름 글자의 시작점을 표시하고 점선 학습지를 활용하여 단계적으로 지도한다.",
  "evaluation_method": "관찰 평가, 학습지",
  "evaluation_criteria": ["점선을 따라 글자를 쓸 수 있는가?", "글자의 시작점과 방향을 따라 쓰는가?"]
}

위 JSON 한 개만 출력. 다른 키, 설명, 마크다운 일체 금지.
`.trim()
}

export function parseJSON(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        return null
      }
    }
    return null
  }
}

export function formatPeriodFromJSON(json, period) {
  if (!json) return ''
  const lines = [`[${period} 계획]`]
  lines.push('- 기간 목표:')
  lines.push(`  ${json.period_goal || ''}`)
  lines.push('- 교육내용:')
  ;(json.contents || []).forEach(c => lines.push(`  ${c}`))
  lines.push('- 교육방법:')
  lines.push(`  ${json.method || ''}`)
  lines.push('- 평가방법:')
  lines.push(`  ${json.evaluation_method || ''}`)
  lines.push('- 평가준거:')
  ;(json.evaluation_criteria || []).forEach(c => lines.push(`  ${c}`))
  return lines.join('\n')
}

function normalizeForCompare(text) {
  return String(text || '')
    .replace(/\s+/g, '')
    .replace(/[.!?,，、;；:()[\]{}"']/g, '')
    .trim()
}

function goalTokens(text) {
  return String(text || '')
    .replace(/[^\w가-힣\s]/g, ' ')
    .split(/\s+/)
    .map(token => token.trim())
    .filter(token => token.length >= 2)
}

function tokenOverlapRatio(a, b) {
  const aTokens = [...new Set(goalTokens(a))]
  const bTokens = [...new Set(goalTokens(b))]
  if (aTokens.length === 0 || bTokens.length === 0) return 0
  const overlap = aTokens.filter(token => bTokens.includes(token)).length
  return overlap / Math.min(aTokens.length, bTokens.length)
}

export function validatePeriodJSON(json, previousGoals = []) {
  const errors = []
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return { ok: false, errors: ['JSON 객체가 아닙니다.'] }
  }

  const goal = typeof json.period_goal === 'string' ? json.period_goal.trim() : ''
  if (!goal) errors.push('기간 목표가 비어 있습니다.')

  const normalizedGoal = normalizeForCompare(goal)
  const hasDuplicateGoal = previousGoals.some(prev => {
    const normalizedPrev = normalizeForCompare(prev)
    return normalizedPrev && normalizedGoal && normalizedPrev === normalizedGoal
  })
  if (hasDuplicateGoal) errors.push('이전 기간 목표와 같습니다.')

  const previousGoal = previousGoals[previousGoals.length - 1] || ''
  if (previousGoal && tokenOverlapRatio(goal, previousGoal) >= 0.75) {
    errors.push('직전 목표와 수준 차이가 거의 없습니다.')
  }

  if (!Array.isArray(json.contents) || json.contents.filter(Boolean).length < 3) {
    errors.push('교육내용이 3개 미만입니다.')
  }
  if (typeof json.method !== 'string' || !json.method.trim()) {
    errors.push('교육방법이 비어 있습니다.')
  }
  if (typeof json.evaluation_method !== 'string' || !json.evaluation_method.trim()) {
    errors.push('평가방법이 비어 있습니다.')
  }
  if (!Array.isArray(json.evaluation_criteria) || json.evaluation_criteria.filter(Boolean).length < 2) {
    errors.push('평가준거가 2개 미만입니다.')
  }

  return { ok: errors.length === 0, errors }
}

export function cleanupPeriodPlan(text, period) {
  if (!text) return ''
  let t = text

  t = t.replace(/\*\*([^*]+)\*\*/g, '$1')
  t = t.replace(/\*([^*\n]+)\*/g, '$1')
  t = t.replace(/^#{1,6}\s+/gm, '')
  t = t.replace(/`([^`]+)`/g, '$1')
  t = t.replace(/^\s*>\s+/gm, '')
  t = t.replace(/^---+\s*$/gm, '')
  t = t.replace(/^={3,}\s*$/gm, '')

  const idx = t.indexOf(`[${period} 계획]`)
  if (idx >= 0) {
    t = t.slice(idx)
  } else {
    const altMatch = t.match(/\[[^\]]*계획\]/)
    if (altMatch) {
      t = `[${period} 계획]` + t.slice(altMatch.index + altMatch[0].length)
    } else {
      t = `[${period} 계획]\n` + t
    }
  }

  t = t.split('\n').map(line => {
    const m = line.match(/^\s*[*•]\s+(.+)$/)
    if (m) return '  ' + m[1]
    return line
  }).join('\n')

  return t.trim()
}

export function parsePrevLevel(prevIEP) {
  if (!prevIEP) return ''
  const m = prevIEP.match(/-\s*현행\s*수준\s*:\s*\n([\s\S]*?)(?=\n\s*-\s*[가-힣]|\n\s*\*|\n\s*\[|$)/)
  if (!m) return ''
  return m[1].split('\n').map(s => s.trim()).filter(Boolean).join(' ')
}

export function buildFinalIEP({ title, grade, level, goal, standardsText, evalMethod, evalFocus, monthlyPlans }) {
  const lines = []
  if (title) {
    lines.push(`[${title}]`)
    lines.push('')
  }
  lines.push('[IEP 학기계획]')
  const gradeText = /^\d+$/.test(String(grade)) ? `${grade}학년` : String(grade)
  lines.push(`- 학년:\n  ${gradeText}`)
  lines.push(`- 현행 수준:\n  ${level}`)
  lines.push(`- 학기 목표:\n  ${goal}`)
  if (standardsText) lines.push(standardsText)
  lines.push(`*평가방법*\n${evalMethod}`)
  lines.push(`*평가초점*\n${evalFocus}`)
  if (monthlyPlans) {
    lines.push('---')
    lines.push('[기간별 계획]')
    lines.push(monthlyPlans)
  }
  return lines.join('\n')
}

export function parsePeriods(input) {
  return (input || '')
    .replace(/[，、;；/|]+/g, ',')
    .replace(/\s+/g, ',')
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

// ==== AI 출력 후처리 ====

export function cleanupReview(text) {
  if (!text) return ''
  let t = text

  const startIdx = t.indexOf('[현행 수준 정리]')
  if (startIdx > 0) t = t.slice(startIdx)

  t = t.replace(/[^[\]()*\-/+,.\s가-힣a-zA-Z0-9?!~~·]/g, '')

  return t.trim()
}

export function cleanupGoal(text) {
  if (!text) return ''
  let g = text.trim()

  const m = g.match(/\[수정\]\s*(.+?)(?:\n|$)/)
  if (m) g = m[1].trim()

  g = g.replace(/^[*\-\s]+/, '')
  g = g.replace(/^"|"$/g, '')

  if (!g.endsWith('.')) {
    if (g.endsWith('기')) g = g.slice(0, -1) + '한다.'
    else if (g.endsWith('함')) g = g.slice(0, -1) + '한다.'
    else if (g.endsWith('다')) g = g + '.'
    else g = g + '.'
  }
  return g
}

export function cleanupEvalMethod(text) {
  if (!text) return '관찰 평가, 포트폴리오'
  const valid = EVAL_METHOD_OPTIONS
  const found = []

  for (const m of valid) {
    if (text.includes(m)) found.push(m)
  }

  if (!found.includes('관찰 평가')) found.unshift('관찰 평가')

  const result = found.slice(0, 3)
  if (result[0] !== '관찰 평가') {
    const i = result.indexOf('관찰 평가')
    if (i > 0) {
      result.splice(i, 1)
      result.unshift('관찰 평가')
    }
  }

  return result.join(', ')
}

export function cleanupEvalFocus(text) {
  if (!text) return ''
  return text
    .split('\n')
    .map(line => line.trim().replace(/^[\-*\s]+/, ''))
    .filter(line => line.length > 0)
    .map(line => {
      if (line.endsWith('?')) return line
      if (line.endsWith('가')) return line + '?'
      if (/[가-힣]$/.test(line)) return line + '하는가?'
      return line + '?'
    })
    .join('\n')
}

export function cleanupLevel(text) {
  if (!text) return ''
  const NOMINAL_END = /[가-힣]?(ㅁ|음|함|임|감|봄|잠|씀|앎|삶|듦|큼|좋음|먹음|읽음|받음|어려움|작음)$/

  return text
    .split(/(?<=\.)\s+|\n+/)
    .map(s => s.trim().replace(/^[\-*\s]+/, ''))
    .filter(s => s.length > 0)
    .map(s => {
      const stripped = s.replace(/[.!?]+$/, '')

      if (/[ㅁ음함임감봄잠씀앎삶듦큼]\.?$/.test(s)) {
        return stripped + '.'
      }

      if (/이다\.?$/.test(s)) return stripped.replace(/이다$/, '임') + '.'
      if (/한다\.?$/.test(s)) return stripped.replace(/한다$/, '함') + '.'
      if (/된다\.?$/.test(s)) return stripped.replace(/된다$/, '됨') + '.'

      return stripped + '.'
    })
    .join(' ')
}
