import { useState, useEffect } from 'react'
import SetupScreen from './components/SetupScreen.jsx'
import IEPWriter from './components/IEPWriter.jsx'
import { checkOllama } from './lib/ollama.js'

export default function App() {
  const [screen, setScreen] = useState('loading')
  const [ollamaInfo, setOllamaInfo] = useState({ ok: false, models: [] })
  const [systemInfo, setSystemInfo] = useState(null)

  useEffect(() => {
    async function init() {
      const info = await checkOllama()
      setOllamaInfo(info)

      let sysInfo = { totalRamGB: 16, model: 'gemma4:e2b', mode: '고품질' }
      if (window.electronAPI) {
        sysInfo = await window.electronAPI.getSystemInfo()
      }
      if (info.ok && !info.models.includes(sysInfo.model) && info.models.length > 0) {
        sysInfo = { ...sysInfo, model: info.models[0], recommendedModel: sysInfo.model }
      }
      setSystemInfo(sysInfo)
      setScreen(info.ok && info.models.includes(sysInfo.model) ? 'writer' : 'setup')
    }
    init()
  }, [])

  const handleOllamaReady = async (selectedModel) => {
    const info = await checkOllama()
    setOllamaInfo(info)
    const model = selectedModel || systemInfo?.model || info.models[0] || 'gemma4:e2b'
    if (info.ok && info.models.includes(model)) {
      setSystemInfo(prev => ({ ...(prev || {}), model, recommendedModel: prev?.recommendedModel || prev?.model }))
      setScreen('writer')
    }
  }

  if (screen === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">시스템 확인 중...</p>
        </div>
      </div>
    )
  }

  if (screen === 'setup') {
    return <SetupScreen onReady={handleOllamaReady} systemInfo={systemInfo} ollamaInfo={ollamaInfo} />
  }

  return <IEPWriter ollamaInfo={ollamaInfo} systemInfo={systemInfo} />
}
