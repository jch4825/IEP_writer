import { useState } from 'react'
import { checkOllama } from '../lib/ollama.js'

export default function SetupScreen({ onReady, systemInfo, ollamaInfo }) {
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState('')
  const [latestInfo, setLatestInfo] = useState(null)

  const model = systemInfo?.model ?? 'gemma4:e2b'
  const recommendedModel = systemInfo?.recommendedModel
  const displayInfo = latestInfo || ollamaInfo
  const installedModels = displayInfo?.models || []
  const fallbackModel = installedModels[0]
  const installCommand = 'irm https://ollama.com/install.ps1 | iex'
  const modelCommand = `ollama run ${model}`
  const hasOllama = !!displayInfo?.ok
  const hasModel = hasOllama && installedModels.includes(model)
  const canUseInstalledModel = hasOllama && !hasModel && !!fallbackModel

  const handleCheck = async () => {
    setChecking(true)
    setMessage('')
    const info = await checkOllama()
    setLatestInfo(info)
    if (info.ok && info.models.includes(model)) {
      onReady(model)
    } else {
      setMessage(info.ok
        ? `${model} 모델이 아직 없습니다. 아래 3번 명령을 실행하거나, 설치된 다른 모델로 계속할 수 있습니다.`
        : 'Ollama에 연결되지 않습니다. Ollama가 설치되어 있고 실행 중인지 확인하세요.')
      setChecking(false)
    }
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text)
      setMessage('명령어를 복사했습니다. 열린 명령 창에 붙여넣고 Enter를 누르세요.')
    } catch {
      setMessage('복사가 되지 않으면 명령어를 직접 선택해서 복사하세요.')
    }
  }

  return (
    <div className="app-shell flex items-center justify-center p-4">
      <div className="product-card w-full max-w-2xl rounded-3xl p-8">
        <div className="text-center mb-8">
          <div className="brand-mark mb-4">AI</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">IEP Writer</h1>
          <p className="text-slate-500 text-sm">AI가 내 컴퓨터에서 실행될 준비가 되었는지 확인합니다.</p>
        </div>

        {systemInfo && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3 mb-6 text-xs text-slate-600 text-center">
            RAM {systemInfo.totalRamGB}GB · 사용할 AI 모델: {model}
            {recommendedModel && recommendedModel !== model && (
              <span className="block mt-1 text-amber-600">
                권장 모델 {recommendedModel} 대신 설치된 모델 {model}을 사용합니다.
              </span>
            )}
          </div>
        )}

        <div className="space-y-3 mb-6">
          <StatusRow
            ok={hasOllama}
            text="Ollama 연결"
            detail={hasOllama ? '앱이 Ollama 서버를 찾았습니다.' : 'Ollama가 꺼져 있거나 아직 설치되지 않았습니다.'}
          />
          <StatusRow
            ok={hasModel}
            text={`${model} 모델 준비`}
            detail={hasModel
              ? '바로 AI 작성을 시작할 수 있습니다.'
              : installedModels.length > 0
                ? `설치된 모델: ${installedModels.join(', ')}`
                : '아직 사용할 모델이 없습니다.'}
          />
        </div>

        {canUseInstalledModel && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 mb-6 shadow-sm">
            <p className="text-sm font-medium text-amber-800 mb-1">필요한 모델은 없지만 다른 모델이 설치되어 있습니다.</p>
            <p className="text-xs text-amber-700 mb-3">처음이라면 아래 버튼으로 계속해도 됩니다. 결과 품질이나 속도는 모델에 따라 달라질 수 있습니다.</p>
            <button
              onClick={() => onReady(fallbackModel)}
              className="w-full rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
            >
              {fallbackModel}로 계속하기
            </button>
          </div>
        )}

        <div className="space-y-5 mb-8">
          <Step
            num={1}
            text="Windows 검색에서 명령 창을 엽니다."
            detail="Windows 키를 누르고 powershell을 입력한 뒤 Windows PowerShell을 엽니다."
          />
          <Step
            num={2}
            text="Ollama를 설치합니다."
            detail="아래 명령어를 복사해 PowerShell에 붙여넣고 Enter를 누르세요. 설치가 끝날 때까지 기다립니다."
            code={installCommand}
            onCopy={() => copy(installCommand)}
          />
          <Step
            num={3}
            text={`${model} 모델을 내려받고 실행합니다.`}
            detail="같은 명령 창에 아래 명령어를 붙여넣고 Enter를 누르세요. 처음 실행할 때는 다운로드 때문에 시간이 걸립니다."
            code={modelCommand}
            onCopy={() => copy(modelCommand)}
          />
          <Step
            num={4}
            text="이 화면으로 돌아와 연결 확인을 누릅니다."
            detail="명령 창에서 모델이 실행된 상태가 되면 아래 버튼을 누르세요."
          />
        </div>

        {message && (
          <p className="text-blue-600 text-sm text-center mb-4">{message}</p>
        )}

        <button
          onClick={handleCheck}
          disabled={checking}
          className="primary-button w-full py-3 disabled:opacity-50"
        >
          {checking ? '확인 중...' : hasModel ? '시작하기' : '연결 확인'}
        </button>
      </div>
    </div>
  )
}

function StatusRow({ ok, text, detail }) {
  return (
    <div className={`flex items-start gap-2 text-sm ${ok ? 'text-green-700' : 'text-slate-600'}`}>
      <span className={`mt-1.5 h-2.5 w-2.5 rounded-full shadow-sm ${ok ? 'bg-green-500 shadow-green-200' : 'bg-slate-300'}`} />
      <span>
        <span className="font-medium">{text}</span>
        {detail && <span className="block text-xs text-slate-500 mt-0.5">{detail}</span>}
      </span>
    </div>
  )
}

function Step({ num, text, detail, code, onCopy }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-[0_8px_16px_rgba(37,99,235,0.20)]">{num}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-700">{text}</p>
        {detail && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{detail}</p>}
        {code && (
          <div className="mt-2 flex gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 select-text">{code}</code>
            <button
              onClick={onCopy}
              className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-slate-900"
            >
              복사
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
