import { useState } from 'react'

export default function ResultPanel({ iep, title, onTitleChange, onCopy }) {
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleCopy() {
    if (!iep) return
    try {
      if (window.electronAPI) {
        await window.electronAPI.copyToClipboard(iep)
      } else {
        await navigator.clipboard.writeText(iep)
      }
      setCopied(true)
      onCopy('복사됐습니다. Ctrl+V로 붙여넣기 하세요.')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      onCopy('복사 실패')
    }
  }

  async function handleSave() {
    if (!iep) return
    if (!window.electronAPI) {
      onCopy('TXT 저장은 Electron에서만 가능합니다')
      return
    }
    setSaving(true)
    try {
      const safeTitle = (title || 'IEP').replace(/[\\/:*?"<>|]/g, '_')
      const r = await window.electronAPI.saveTxt({
        defaultName: `${safeTitle}.txt`,
        content: iep,
      })
      if (r.ok) onCopy(`저장됨: ${r.path}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-96 flex-shrink-0 flex flex-col border-l border-white/70 bg-slate-50/80 backdrop-blur">
      <div className="border-b border-white/70 bg-white/85 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-800">IEP 결과물</span>
          <div className="flex gap-1.5">
            <button
              onClick={handleCopy}
              disabled={!iep}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                ${iep ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                ${copied ? '!bg-green-600' : ''}
              `}
            >
              {copied ? '✓ 복사됨' : '전체 복사'}
            </button>
            <button
              onClick={handleSave}
              disabled={!iep || saving}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                ${iep ? 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
              `}
            >
              {saving ? '저장 중...' : 'TXT 저장'}
            </button>
          </div>
        </div>

        <input
          type="text"
          value={title || ''}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="제목을 입력하세요 (예: 김OO_2026_1학기)"
          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs shadow-inner shadow-slate-100/60 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
        />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {iep ? (
          <pre className="document-paper min-h-full p-5 text-xs leading-6 text-slate-700 whitespace-pre-wrap font-sans select-text">
            {iep}
          </pre>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="document-paper w-full max-w-64 p-6 text-center">
              <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center text-xl">□</div>
              <p className="text-xs text-slate-400">작성이 진행되면<br />여기에 결과물이 표시됩니다</p>
            </div>
          </div>
        )}
      </div>

      {iep && (
        <div className="border-t border-white/70 bg-white/70 px-4 py-3">
          <p className="text-xs text-slate-400 text-center">복사 후 한글·워드에 Ctrl+V</p>
        </div>
      )}
    </div>
  )
}
