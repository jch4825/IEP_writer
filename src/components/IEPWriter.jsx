import { useState, useEffect, useRef } from 'react'
import StepIndicator from './StepIndicator.jsx'
import ResultPanel from './ResultPanel.jsx'
import { streamChat } from '../lib/ollama.js'
import { searchRelated, formatStandards, getSubjects, getStandardsBy, searchByKeyword, GRADE_OPTIONS, gradeLabel } from '../lib/csvSearch.js'
import { makeStep3Prompt, makeEvalFocusPrompt, makeSinglePeriodPrompt, buildFinalIEP, parsePeriods, cleanupGoal, cleanupEvalMethod, cleanupEvalFocus, cleanupLevel, parsePrevLevel, parseJSON, formatPeriodFromJSON, validatePeriodJSON } from '../lib/iepPrompts.js'

const INITIAL = {
  screen: 'init',
  previousIEP: '',
  previousFileName: '',
  step: 0,
  iepType: '',
  grade: '',
  selectedSubject: '',
  level: '',
  goal: '',
  standardsText: '',
  evalMethod: '',
  evalFocus: '',
  cleanLevel: '',
  cleanGoal: '',
  periodsInput: '',
  monthlyPlans: '',
  aiReview: '',
  finalIEP: '',
  title: '',
  periodProgress: null,
}

export default function IEPWriter({ ollamaInfo, systemInfo }) {
  const [state, setState] = useState(INITIAL)
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [aiError, setAiError] = useState('')
  const [toast, setToast] = useState('')
  const abortRef = useRef(null)

  const model = systemInfo?.model ?? 'gemma4:e2b'

  function update(patch) {
    setState(prev => ({ ...prev, ...patch }))
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  async function runStream(systemPrompt, userContent, opts = {}) {
    const controller = new AbortController()
    abortRef.current = controller
    setStreaming(true)
    setStreamText('')
    setAiError('')
    let full = ''
    try {
      await streamChat({
        model,
        systemPrompt,
        messages: [{ role: 'user', content: userContent }],
        format: opts.format,
        signal: controller.signal,
        onToken: (_, accumulated) => {
          full = accumulated
          setStreamText(accumulated)
        },
      })
      return full
    } catch (e) {
      const message = e?.name === 'AbortError'
        ? '작업을 취소했습니다.'
        : `AI 응답을 받지 못했습니다. Ollama가 실행 중인지, 모델 ${model}이 준비되어 있는지 확인하세요. (${e.message})`
      setAiError(message)
      setStreamText(`오류: ${message}`)
      return ''
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  function cancelStream() {
    abortRef.current?.abort()
  }

  // ==== 초기 화면: 이전 IEP 불러오기 ====
  if (state.screen === 'init') {
    return (
      <div className="app-shell flex h-screen flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="product-card w-full max-w-md rounded-3xl p-10 mx-4">
            <div className="text-center mb-8">
              <div className="brand-mark mb-4">▤</div>
              <h1 className="text-xl font-bold text-slate-800 mb-2">IEP 작성을 시작합니다</h1>
              <p className="text-slate-500 text-sm">이전 IEP가 있으면 현행 수준을 자동으로 가져올 수 있습니다.</p>
            </div>

            {state.previousIEP && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-blue-700">📄 {state.previousFileName}</span>
                  <button
                    onClick={() => update({ previousIEP: '', previousFileName: '', level: '' })}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >제거</button>
                </div>
                {state.level && (
                  <div className="rounded-xl border border-blue-100 bg-white p-2 mb-2">
                    <p className="text-xs text-blue-600 font-medium mb-1">✅ 자동 추출된 현행 수준 (다음 단계에 미리 입력됨)</p>
                    <p className="text-xs text-slate-700">{state.level.slice(0, 200)}{state.level.length > 200 ? '...' : ''}</p>
                  </div>
                )}
                <details className="text-xs">
                  <summary className="text-slate-500 cursor-pointer">전체 내용 보기</summary>
                  <pre className="text-xs text-slate-600 whitespace-pre-wrap max-h-32 overflow-y-auto scrollbar-thin mt-2">{state.previousIEP.slice(0, 500)}{state.previousIEP.length > 500 ? '...' : ''}</pre>
                </details>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={async () => {
                  if (!window.electronAPI) {
                    showToast('Electron 환경에서만 가능합니다')
                    return
                  }
                  const r = await window.electronAPI.openTxt()
                  if (r.ok) {
                    const extractedLevel = parsePrevLevel(r.content)
                    update({
                      previousIEP: r.content,
                      previousFileName: r.name,
                      level: extractedLevel || state.level,
                    })
                    if (extractedLevel) showToast('이전 현행 수준을 자동으로 불러왔습니다')
                  }
                }}
                className="secondary-button w-full px-5 py-3 text-sm"
              >
                {state.previousIEP ? '다른 파일 선택' : '이전 IEP TXT 불러오기'}
              </button>

              <button
                onClick={() => update({ screen: 'main', step: 0 })}
                className="primary-button w-full px-5 py-3 text-sm"
              >
                {state.previousIEP ? '확인 — IEP 작성 시작' : 'IEP 작성 시작'}
              </button>
            </div>

            {systemInfo && (
              <p className="text-xs text-slate-400 text-center mt-6">
                RAM {systemInfo.totalRamGB}GB · {model}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ==== STEP 0: 유형 선택 ====
  if (state.step === 0) {
    return (
      <div className="app-shell flex h-screen flex-col">
        <StepIndicator current={0} />
        <div className="flex-1 flex overflow-hidden">
          <PreviousIEPPanel content={state.previousIEP} fileName={state.previousFileName} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-800 mb-3">IEP 유형을 선택하세요</h2>
              <p className="text-sm text-slate-500 mb-8">목표의 기준이 교과 성취기준인지, 일상생활 지원인지에 따라 이후 질문이 달라집니다.</p>
              <div className="grid grid-cols-1 gap-4 justify-center max-w-xl sm:grid-cols-2">
                {[
                  { type: '교과 중심', desc: '국어, 수학 등 교과 성취기준을 바탕으로 작성합니다.' },
                  { type: '생활지원 중심', desc: '의사소통, 자립, 행동, 일상생활 목표를 중심으로 작성합니다.' },
                ].map(({ type, desc }) => (
                  <button
                    key={type}
                    onClick={() => update({ iepType: type, step: 1 })}
                    className="soft-card rounded-2xl px-6 py-5 text-left transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/70 hover:shadow-[0_18px_38px_rgba(37,99,235,0.10)]"
                  >
                    <span className="block font-semibold text-slate-800 text-lg mb-2">{type}</span>
                    <span className="block text-xs text-slate-500 leading-relaxed">{desc}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => update({ screen: 'init' })}
                className="text-xs text-slate-400 hover:text-slate-600 mt-6 underline"
              >
                ← 이전 단계로
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==== STEP 1: 기본 정보 ====
  if (state.step === 1) {
    return (
      <div className="app-shell flex h-screen flex-col">
        <StepIndicator current={1} />
        <div className="flex-1 flex overflow-hidden">
          <PreviousIEPPanel content={state.previousIEP} fileName={state.previousFileName} />
          <Step1Form
            state={state}
            update={update}
            onSubmit={() => handleStep2(state, update, runStream)}
          />
        </div>
      </div>
    )
  }

  // ==== STEP 2: AI 분석 결과 (직접 편집 가능) ====
  if (state.step === 2) {
    const handleEdit = (patch) => {
      const newState = { ...state, ...patch }
      update({ ...patch, finalIEP: rebuildIEP(newState) })
    }

    return (
      <div className="app-shell flex h-screen flex-col">
        <StepIndicator current={2} />
        <div className="flex-1 flex gap-0 overflow-hidden">
          <PreviousIEPPanel content={state.previousIEP} fileName={state.previousFileName} />
          <div className="flex-1 flex flex-col p-6 overflow-y-auto scrollbar-thin">
            <div className="product-card rounded-3xl p-6 max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-800">AI 분석 결과</h2>
                {!streaming && state.aiReview && (
                  <span className="text-xs text-slate-500">✏️ 모든 필드 직접 수정 가능</span>
                )}
              </div>

              {streaming && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="text-sm text-blue-700 font-medium">
                      {state.aiReview ? '🎯 2단계: 평가초점 생성 중' : '📝 1단계: 현행 수준 / 학기 목표 / 평가방법 생성 중'}
                    </div>
                    <button
                      onClick={cancelStream}
                      className="px-2.5 py-1 rounded-md border border-blue-200 bg-white text-xs text-blue-700 hover:bg-blue-100"
                    >
                      취소
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-500">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    AI가 JSON 형식으로 답변을 작성하고 있습니다 ({Math.floor(streamText.length)}자)
                  </div>
                </div>
              )}

              {aiError && !streaming && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-red-700 mb-1">AI 작업을 완료하지 못했습니다.</p>
                  <p className="text-xs text-red-600 leading-relaxed mb-3">{aiError}</p>
                  <button
                    onClick={() => handleStep2(state, update, runStream)}
                    className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium"
                  >
                    다시 시도
                  </button>
                </div>
              )}

              {!streaming && state.aiReview && !state.evalFocus && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-xs text-blue-700">
                  ⏳ 평가초점 생성 준비 중...
                </div>
              )}

              {!streaming && state.aiReview && state.evalFocus && (
                <div className="space-y-4">
                  <EditField
                    label="현행 수준"
                    hint="~~함. 형태로 한 문단"
                    value={state.cleanLevel}
                    onChange={v => handleEdit({ cleanLevel: v })}
                    rows={3}
                  />

                  <EditField
                    label="학기 목표"
                    hint="~한다. 형태로 한 문장"
                    value={state.cleanGoal}
                    onChange={v => handleEdit({ cleanGoal: v })}
                    rows={2}
                  />

                  <EditField
                    label="평가방법"
                    hint="관찰 평가 + 1~2개 (10개 옵션 중)"
                    value={state.evalMethod}
                    onChange={v => handleEdit({ evalMethod: v })}
                    rows={1}
                  />

                  <EditField
                    label="평가초점"
                    hint="~하는가? / ~할 수 있는가? 형태로 줄바꿈"
                    value={state.evalFocus}
                    onChange={v => handleEdit({ evalFocus: v })}
                    rows={3}
                  />

                  {state.iepType === '교과 중심' && state.standardsText && (
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                      <p className="text-xs text-amber-700 font-medium mb-2">📚 관련 성취기준 (자동 탐색)</p>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap">{state.standardsText}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!streaming && state.aiReview && state.evalFocus && (
              <div className="mt-4 flex gap-3 max-w-2xl">
                <button
                  onClick={() => update({ step: 1 })}
                  className="secondary-button px-5 py-2 text-sm"
                >
                  처음 입력 다시
                </button>
                <button
                  onClick={() => handleStep2(state, update, runStream)}
                  className="secondary-button px-5 py-2 text-sm"
                >
                  AI 다시 생성
                </button>
                <button
                  onClick={() => update({ step: 3 })}
                  className="primary-button flex-1 py-2 text-sm"
                >
                  확인 — 기간별 계획으로
                </button>
              </div>
            )}
          </div>

          <ResultPanel iep={state.finalIEP} title={state.title} onTitleChange={t => update({ title: t })} onCopy={showToast} />
        </div>
        {toast && <Toast msg={toast} />}
      </div>
    )
  }

  // ==== STEP 3: 기간별 계획 ====
  if (state.step === 3) {
    const periods = parsePeriods(state.periodsInput)
    return (
      <div className="app-shell flex h-screen flex-col">
        <StepIndicator current={3} />
        <div className="flex-1 flex gap-0 overflow-hidden">
          <PreviousIEPPanel content={state.previousIEP} fileName={state.previousFileName} />
          <div className="flex-1 flex flex-col p-6 overflow-y-auto scrollbar-thin">
            <div className="product-card rounded-3xl p-6 max-w-2xl">
              <h2 className="font-bold text-slate-800 mb-1">기간별 계획 생성</h2>
              <p className="text-sm text-slate-500 mb-1">월 목표를 어떻게 구분할까요?</p>
              <p className="text-xs text-slate-400 mb-4">예) <code className="bg-slate-100 px-1 py-0.5 rounded">3-4월, 5-7월</code> · 쉼표로 구분하면 각 기간마다 한 개의 계획을 생성합니다</p>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={state.periodsInput}
                  onChange={e => update({ periodsInput: e.target.value })}
                  placeholder="예) 3-4월, 5-7월"
                  className="form-control flex-1"
                />
                <button
                  disabled={periods.length === 0 || streaming}
                  onClick={() => handleStep3(state, update, runStream, periods)}
                  className="primary-button px-4 py-2 text-sm disabled:opacity-60"
                >
                  생성
                </button>
              </div>

              {periods.length > 0 && !streaming && !state.monthlyPlans && !state.periodProgress && (
                <p className="text-xs text-blue-600 mb-3">📌 {periods.length}개의 기간 계획이 순차적으로 생성됩니다: {periods.join(' / ')}</p>
              )}

              {state.periodProgress && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-blue-700">
                      🔄 {state.periodProgress.current}/{state.periodProgress.total} 기간 생성 중 — {state.periodProgress.label}
                    </span>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${(state.periodProgress.current / state.periodProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {state.monthlyPlans && !streaming && !state.periodProgress && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500">✏️ 직접 수정 가능</span>
                  </div>
                  <textarea
                    value={state.monthlyPlans}
                    onChange={e => {
                      const monthlyPlans = e.target.value
                      const newState = { ...state, monthlyPlans }
                      update({ monthlyPlans, finalIEP: rebuildIEP(newState) })
                    }}
                    rows={Math.min(30, Math.max(10, state.monthlyPlans.split('\n').length + 1))}
                    className="form-control mb-3 w-full resize-y font-sans leading-relaxed text-slate-700"
                  />
                </div>
              )}

              {state.monthlyPlans && (streaming || state.periodProgress) && (
                <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed mb-3">
                  {state.monthlyPlans}
                </div>
              )}

              {streaming && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      {state.periodProgress?.label || '기간'} 계획 생성 중 ({Math.floor(streamText.length)}자)
                    </div>
                    <button
                      onClick={cancelStream}
                      className="px-2.5 py-1 rounded-md border border-blue-200 bg-white text-xs text-blue-700 hover:bg-blue-100"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              {aiError && !streaming && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                  <p className="text-sm font-medium text-red-700 mb-1">기간 계획 생성을 완료하지 못했습니다.</p>
                  <p className="text-xs text-red-600 leading-relaxed">{aiError}</p>
                </div>
              )}
            </div>

            {!streaming && state.monthlyPlans && (
              <div className="mt-4 flex gap-3 max-w-xl">
                <button
                  onClick={() => update({ step: 2 })}
                  className="secondary-button px-5 py-2 text-sm"
                >
                  이전
                </button>
                <button
                  onClick={() => update({ finalIEP: rebuildIEP(state), step: 4 })}
                  className="primary-button flex-1 py-2 text-sm"
                >
                  완성 보기
                </button>
              </div>
            )}
          </div>

          <ResultPanel iep={state.finalIEP} title={state.title} onTitleChange={t => update({ title: t })} onCopy={showToast} />
        </div>
        {toast && <Toast msg={toast} />}
      </div>
    )
  }

  // ==== STEP 4: 완성 ====
  if (state.step === 4) {
    return (
      <div className="app-shell flex h-screen flex-col">
        <StepIndicator current={4} />
        <div className="flex-1 flex gap-0 overflow-hidden">
          <PreviousIEPPanel content={state.previousIEP} fileName={state.previousFileName} />
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">최종 결과 확인</h2>
                <p className="text-sm text-slate-500">다운로드하거나 복사하기 전에 전문을 직접 수정할 수 있습니다.</p>
              </div>
              <button
                onClick={() => setState(INITIAL)}
                className="secondary-button px-4 py-2 text-sm"
              >
                새 IEP 작성
              </button>
            </div>
            <textarea
              value={state.finalIEP || ''}
              onChange={e => update({ finalIEP: e.target.value })}
              className="document-paper flex-1 w-full resize-none p-5 font-sans text-sm leading-relaxed text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <ResultPanel iep={state.finalIEP} title={state.title} onTitleChange={t => {
            const newState = { ...state, title: t }
            update({ title: t })
          }} onCopy={showToast} />
        </div>
        {toast && <Toast msg={toast} />}
      </div>
    )
  }
}

// ==== 핸들러 함수 ====

async function handleStep2(state, update, runStream) {
  update({ step: 2, aiReview: '', standardsText: '', evalFocus: '', cleanLevel: '', cleanGoal: '', evalMethod: '' })

  // === 1단계: 학기 분석 JSON ===
  const userContent = `학년: ${gradeLabel(state.grade)}\n현행 수준: ${state.level}\n학기 목표: ${state.goal}`
  const raw1 = await runStream(makeStep3Prompt(state.iepType, state.previousIEP), userContent, { format: 'json' })
  if (!raw1) return

  const json1 = parseJSON(raw1) || {}
  const cleanLvl = cleanupLevel(json1.level || state.level)
  const cleanG = cleanupGoal(json1.goal_corrected || json1.goal_original || state.goal)
  const methodsArr = Array.isArray(json1.evaluation_methods) ? json1.evaluation_methods : []
  const evalMethod = cleanupEvalMethod(methodsArr.join(', '))

  update({ aiReview: raw1, cleanLevel: cleanLvl, cleanGoal: cleanG, evalMethod })

  // === 2단계: 평가초점 JSON ===
  const focusUserContent = `학기 목표 "${cleanG}" 에 대한 평가초점만 JSON으로 작성하세요.`
  const raw2 = await runStream(
    makeEvalFocusPrompt({ finalGoal: cleanG, level: cleanLvl, evalMethods: evalMethod, grade: state.grade }),
    focusUserContent,
    { format: 'json' }
  )
  const json2 = parseJSON(raw2) || {}
  const focusArr = Array.isArray(json2.evaluation_focus) ? json2.evaluation_focus : []
  const evalFocus = cleanupEvalFocus(focusArr.join('\n'))

  // === 성취기준 검색 (교과 중심) ===
  let standardsText = ''
  if (state.iepType === '교과 중심') {
    const { sameGroup, otherGroup } = await searchRelated({
      grade: state.grade,
      goalText: cleanG || state.goal,
      subject: state.selectedSubject,
    })
    standardsText = formatStandards(sameGroup, otherGroup)
  }

  const preview = buildFinalIEP({
    title: state.title,
    grade: state.grade,
    level: cleanLvl,
    goal: cleanG,
    standardsText,
    evalMethod,
    evalFocus,
    monthlyPlans: '',
  })

  update({ evalFocus, standardsText, finalIEP: preview })
}

function rebuildIEP(state) {
  return buildFinalIEP({
    title: state.title,
    grade: state.grade,
    level: state.cleanLevel || state.level,
    goal: state.cleanGoal || state.goal,
    standardsText: state.standardsText,
    evalMethod: state.evalMethod,
    evalFocus: state.evalFocus,
    monthlyPlans: state.monthlyPlans,
  })
}

async function handleStep3(state, update, runStream, periods) {
  if (periods.length === 0) return

  const reviewJson = parseJSON(state.aiReview) || {}
  const cleanGoal = (state.cleanGoal || reviewJson.goal_corrected || reviewJson.goal_original || state.goal).trim()

  let accumulated = ''
  let prevPeriodPlan = null
  const previousPeriodGoals = []

  update({ monthlyPlans: '', periodProgress: { current: 0, total: periods.length, label: '' } })

  for (let i = 0; i < periods.length; i++) {
    const period = periods[i]
    update({ periodProgress: { current: i + 1, total: periods.length, label: period } })

    const prompt = makeSinglePeriodPrompt({
      period,
      finalGoal: cleanGoal,
      evalMethods: state.evalMethod,
      evalFocus: state.evalFocus,
      level: state.cleanLevel,
      grade: state.grade,
      prevPeriodPlan,
      previousPeriodGoals,
      indexLabel: `${i + 1}/${periods.length}`,
    })
    const userContent = `위 학생 정보를 바탕으로 "${period}" 한 기간의 계획만 작성하세요.`

    let raw = await runStream(prompt, userContent, { format: 'json' })
    if (!raw) break

    let json = parseJSON(raw)
    let validation = validatePeriodJSON(json, previousPeriodGoals)

    if (!validation.ok) {
      const retryContent = `${userContent}

이전 응답의 문제:
${validation.errors.map(e => `- ${e}`).join('\n')}

반드시 새 JSON 객체 1개만 다시 작성하세요.
period_goal은 이미 사용한 기간 목표와 같은 문장이면 안 됩니다.
직전 목표와 비슷한 말만 바꾸지 말고, 도움 줄이기 / 정확도 높이기 / 독립 수행 정도 높이기 / 적용 범위 넓히기 / 일반화 중 하나로 더 높은 수준을 반영하세요.
지원 수준은 신체적 지원 → 언어 지원 → 독립 수행 순서로만 높이고, 독립 수행은 마지막 단계로만 쓰세요.`
      raw = await runStream(prompt, retryContent, { format: 'json' })
      json = parseJSON(raw)
      validation = validatePeriodJSON(json, previousPeriodGoals)
    }

    if (!validation.ok) {
      const failure = [
        `[${period} 계획]`,
        '- 생성 확인 필요:',
        '  AI 응답 형식이 맞지 않아 자동 생성하지 못했습니다.',
        `  확인 내용: ${validation.errors.join(', ')}`,
      ].join('\n')
      accumulated += (i > 0 ? '\n\n' : '') + failure
      update({ monthlyPlans: accumulated })
      continue
    }

    const result = formatPeriodFromJSON(json, period)

    accumulated += (i > 0 ? '\n\n' : '') + result
    update({ monthlyPlans: accumulated })

    prevPeriodPlan = json
    if (json?.period_goal?.trim()) previousPeriodGoals.push(json.period_goal.trim())
  }

  update({ periodProgress: null })
}

function extractSection(text, heading) {
  const regex = new RegExp(`\\[${heading}\\]\\s*([\\s\\S]*?)(?=\\[|\\*|$)`)
  const match = text.match(regex)
  return match ? match[1].trim() : ''
}

function extractEval(text, label) {
  const regex = new RegExp(`\\*${label}\\*\\s*([\\s\\S]*?)(?=\\*|\\[|$)`)
  const match = text.match(regex)
  return match ? match[1].trim() : ''
}

// ==== STEP 1 폼 (성취기준 검색 + 자동완성 포함) ====
function Step1Form({ state, update, onSubmit }) {
  const [subjects, setSubjects] = useState([])
  const [searchSubject, setSearchSubject] = useState(state.selectedSubject || '')
  const [subjectStandards, setSubjectStandards] = useState([])
  const [goalSuggestions, setGoalSuggestions] = useState([])

  const isSubject = state.iepType === '교과 중심'
  const goalHint = isSubject ? '직접 입력하거나 코드/키워드로 자동 검색됩니다' : '생활 기능 목표를 한 문장으로 입력하세요'
  const goalPlaceholder = isSubject
    ? '예) 받침 있는 두 글자 낱말을 읽고 쓴다... 또는 [2국01-02]'
    : '예) 스스로 양치질을 2분 이상 수행한다.'
  const valid = state.grade && state.level.trim() && state.goal.trim()
  const missingFields = [
    !state.grade && '학년',
    !state.level.trim() && '현행 수준',
    !state.goal.trim() && '학기 목표',
  ].filter(Boolean)

  useEffect(() => {
    if (isSubject) getSubjects().then(setSubjects)
  }, [isSubject])

  useEffect(() => {
    if (!searchSubject || !state.grade) {
      setSubjectStandards([])
      return
    }
    getStandardsBy({ subject: searchSubject, grade: state.grade }).then(setSubjectStandards)
  }, [searchSubject, state.grade])

  useEffect(() => {
    if (!isSubject || !state.grade || !state.goal.trim()) {
      setGoalSuggestions([])
      return
    }
    const handle = setTimeout(async () => {
      const r = await searchByKeyword({ keyword: state.goal, grade: state.grade, limit: 4 })
      setGoalSuggestions(r)
    }, 200)
    return () => clearTimeout(handle)
  }, [state.goal, state.grade, isSubject])

  function fillGoalFromStandard(std) {
    update({ goal: std['성취기준 문장'], selectedSubject: std['교과'] || state.selectedSubject })
    setGoalSuggestions([])
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
      <div className="product-card w-full max-w-2xl mx-auto rounded-3xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">{state.iepType}</span>
            <h2 className="text-lg font-bold text-slate-800">기본 정보 입력</h2>
          </div>

          <div className="space-y-5">
            <Field label="학년">
              <select
                value={state.grade}
                onChange={e => update({ grade: e.target.value })}
                className="form-control"
              >
                <option value="">선택</option>
                {GRADE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </Field>

            <Field label="현행 수준" hint="학생의 현재 수준을 자유롭게 입력하세요">
              <textarea
                rows={3}
                value={state.level}
                onChange={e => update({ level: e.target.value })}
                placeholder="예) 자신의 이름을 쓸 수 있으나 받침 있는 글자는 어려움을 보임..."
                className="form-control resize-none"
              />
            </Field>

            {isSubject && state.grade && state.level.trim() && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/85 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-amber-800 mb-1">📚 성취기준 검색 도구</h3>
                <p className="text-xs text-amber-700 mb-3">학기 목표 작성을 도와드립니다. 클릭하면 목표 칸에 자동으로 들어갑니다.</p>

                <select
                  value={searchSubject}
                  onChange={e => {
                    setSearchSubject(e.target.value)
                    update({ selectedSubject: e.target.value })
                  }}
                  className="form-control mb-2 border-amber-200 focus:border-amber-500 focus:ring-amber-100"
                >
                  <option value="">과목 선택</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                {searchSubject && (
                  <div className="rounded-xl border border-amber-100 bg-white max-h-56 overflow-y-auto scrollbar-thin">
                    {subjectStandards.length === 0 ? (
                      <p className="text-xs text-slate-400 p-3 text-center">해당 학년·과목의 성취기준이 없습니다</p>
                    ) : (
                      subjectStandards.map(std => (
                        <button
                          key={std['성취기준 코드']}
                          onClick={() => fillGoalFromStandard(std)}
                          className="w-full text-left p-2.5 hover:bg-amber-50 border-b border-amber-50 last:border-b-0 transition-colors"
                        >
                          <span className="text-xs font-mono text-blue-600 mr-2">{std['성취기준 코드']}</span>
                          <span className="text-xs text-slate-700">{std['성취기준 문장']}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            <Field label="학기 목표" hint={goalHint}>
              <textarea
                rows={2}
                value={state.goal}
                onChange={e => update({ goal: e.target.value })}
                placeholder={goalPlaceholder}
                className="form-control resize-none"
              />

              {isSubject && goalSuggestions.length > 0 && state.goal.trim().length >= 2 && (
                <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50/90 p-2">
                  <p className="text-xs text-blue-700 font-medium mb-1.5">📍 관련 성취기준 (클릭 시 자동 입력)</p>
                  <div className="space-y-1">
                    {goalSuggestions.map(std => (
                      <button
                        key={std['성취기준 코드']}
                        onClick={() => fillGoalFromStandard(std)}
                        className="w-full text-left p-2 bg-white hover:bg-blue-100 rounded-md transition-colors"
                      >
                        <span className="text-xs font-mono text-blue-600 mr-2">{std['성취기준 코드']}</span>
                        <span className="text-xs text-slate-700">{std['성취기준 문장']}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Field>
          </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={() => update({ step: 0 })}
            className="secondary-button px-5 py-2 text-sm"
          >
            이전
          </button>
          <button
            disabled={!valid}
            onClick={onSubmit}
            className="primary-button flex-1 py-2 text-sm disabled:opacity-60"
          >
            AI 분석 시작
          </button>
        </div>
        {!valid && (
          <p className="text-xs text-slate-500 text-center mt-3">
            {missingFields.join(', ')}을 입력하면 AI 분석을 시작할 수 있습니다.
          </p>
        )}
      </div>
    </div>
  )
}

// ==== 이전 개별화 계획 패널 ====
function PreviousIEPPanel({ content, fileName }) {
  const [collapsed, setCollapsed] = useState(false)
  if (!content) return null

  return (
    <div className={`flex-shrink-0 flex flex-col border-r border-slate-100 bg-slate-50 transition-all duration-200 ${collapsed ? 'w-10' : 'w-72'}`}>
      <div className="flex items-center justify-between px-3 py-3 border-b border-slate-200">
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-slate-700">📄 이전 개별화 계획</span>
            {fileName && <p className="text-xs text-slate-400 mt-0.5 truncate" title={fileName}>{fileName}</p>}
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-slate-700 text-xs px-1.5 py-1 rounded hover:bg-slate-200"
          title={collapsed ? '펼치기' : '접기'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>
      {!collapsed && (
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
          <pre className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-sans select-text">{content}</pre>
        </div>
      )}
    </div>
  )
}

// ==== 편집 가능한 필드 ====
function EditField({ label, hint, value, onChange, rows = 2 }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <label className="text-sm font-semibold text-slate-700">{label}</label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        className="form-control w-full resize-none font-sans"
      />
    </div>
  )
}

// ==== 공통 컴포넌트 ====
function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-slate-400 mb-1">{hint}</p>}
      {children}
    </div>
  )
}

function Toast({ msg }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50">
      {msg}
    </div>
  )
}
