import Papa from 'papaparse'

let standards = null

async function loadStandards() {
  if (standards) return standards
  const res = await fetch('./basicCurriculumStandards.csv')
  let text = await res.text()
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true })
  standards = data
  return standards
}

const GRADE_TO_GROUP_NUM = {
  '1': '2', '2': '2',
  '3': '4', '4': '4',
  '5': '6', '6': '6',
  '7': '9', '8': '9', '9': '9',
  '10': '12', '11': '12', '12': '12',
  '전공1': '12', '전공2': '12',
}

export const GRADE_OPTIONS = [
  { value: '1', label: '1학년' },
  { value: '2', label: '2학년' },
  { value: '3', label: '3학년' },
  { value: '4', label: '4학년' },
  { value: '5', label: '5학년' },
  { value: '6', label: '6학년' },
  { value: '7', label: '중1 (7학년)' },
  { value: '8', label: '중2 (8학년)' },
  { value: '9', label: '중3 (9학년)' },
  { value: '10', label: '고1 (10학년)' },
  { value: '11', label: '고2 (11학년)' },
  { value: '12', label: '고3 (12학년)' },
  { value: '전공1', label: '전공1' },
  { value: '전공2', label: '전공2' },
]

export function gradeLabel(grade) {
  if (/^\d+$/.test(String(grade))) return `${grade}학년`
  return String(grade)
}

const GROUP_LABEL = {
  '2': '1~2학년',
  '4': '3~4학년',
  '6': '5~6학년',
  '9': '중학교 1~3학년',
  '12': '고등학교 1~3학년',
}

export function gradeToGroup(grade) {
  return GRADE_TO_GROUP_NUM[String(grade)] ?? '2'
}

const GROUP_ORDER = ['2', '4', '6', '9', '12']

export async function searchRelated({ grade, goalText, subject, limit = 3 }) {
  const data = await loadStandards()
  const groupNum = gradeToGroup(grade)
  const groupIndex = GROUP_ORDER.indexOf(groupNum)

  const keywords = goalText
    .replace(/[^가-힣a-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2)

  const score = (row) => keywords.reduce((acc, kw) =>
    acc + (row['성취기준 문장']?.includes(kw) ? 1 : 0), 0)

  const sameGroup = data
    .filter(r => String(r['학년군']) === groupNum)
    .filter(r => !subject || r['교과'] === subject)
    .map(r => ({ ...r, _score: score(r) }))
    .filter(r => r._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)

  const effectiveSubject = subject || sameGroup[0]?.['교과'] || ''

  const otherGroup = data
    .filter(r => {
      const rowGroup = String(r['학년군'])
      const rowGroupIndex = GROUP_ORDER.indexOf(rowGroup)
      return (
        effectiveSubject &&
        r['교과'] === effectiveSubject &&
        rowGroup !== groupNum &&
        rowGroupIndex >= 0 &&
        groupIndex >= 0 &&
        rowGroupIndex <= groupIndex
      )
    })
    .map(r => ({ ...r, _score: score(r) }))
    .filter(r => r._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)

  return { sameGroup, otherGroup, groupLabel: GROUP_LABEL[groupNum], subject: effectiveSubject }
}

export async function getSubjects() {
  const data = await loadStandards()
  return [...new Set(data.map(r => r['교과']).filter(Boolean))]
}

export async function getStandardsBy({ subject, grade }) {
  const data = await loadStandards()
  const groupNum = gradeToGroup(grade)
  return data.filter(r =>
    r['교과'] === subject &&
    String(r['학년군']) === groupNum
  )
}

export async function searchByKeyword({ keyword, grade, limit = 5 }) {
  if (!keyword || keyword.trim().length < 2) return []
  const data = await loadStandards()
  const groupNum = gradeToGroup(grade)
  const kw = keyword.trim()

  const codeMatch = kw.match(/\[?[0-9]+[가-힣]+[0-9]+-[0-9]+\]?/)
  if (codeMatch) {
    const code = codeMatch[0].replace(/[\[\]]/g, '')
    const found = data.find(r => (r['성취기준 코드'] || '').includes(code))
    return found ? [found] : []
  }

  const matchedSame = data
    .filter(r => String(r['학년군']) === groupNum && r['성취기준 문장']?.includes(kw))
    .slice(0, limit)

  if (matchedSame.length >= limit) return matchedSame

  const matchedOther = data
    .filter(r => String(r['학년군']) !== groupNum && r['성취기준 문장']?.includes(kw))
    .slice(0, limit - matchedSame.length)

  return [...matchedSame, ...matchedOther]
}

export function formatStandards(sameGroup, otherGroup) {
  const lines = []

  lines.push('* [관련 성취기준]')
  if (sameGroup.length === 0) {
    lines.push('  관련 성취기준 없음')
  } else {
    sameGroup.forEach(r => lines.push(`  - ${r['성취기준 코드']}${r['성취기준 문장']}`))
  }

  if (otherGroup.length > 0) {
    lines.push('[기본교육과정 내 대체 성취기준]')
    lines.push('  - 대체 성취기준은 같은 과목에서만 고르며, 현재 학년군보다 높은 학년군은 쓰지 않음')
    otherGroup.forEach(r => {
      const label = GROUP_LABEL[String(r['학년군'])] ?? ''
      lines.push(`  - ${r['성취기준 코드']}${r['성취기준 문장']} (${label})`)
    })
  }

  return lines.join('\n')
}
