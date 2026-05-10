const STEPS = ['유형 선택', '기본 정보', '목표 분석', '월별 계획', '완성']

export default function StepIndicator({ current }) {
  return (
    <div className="scrollbar-thin overflow-x-auto border-b border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
      <div className="flex min-w-max items-center gap-1">
        {STEPS.map((label, i) => {
          const state = i < current ? 'done' : i === current ? 'active' : 'pending'
          return (
            <div key={i} className="flex items-center">
              <div className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors
                ${state === 'done' ? 'bg-blue-50 text-blue-700' : ''}
                ${state === 'active' ? 'bg-blue-600 text-white shadow-[0_8px_18px_rgba(37,99,235,0.20)]' : ''}
                ${state === 'pending' ? 'text-slate-400' : ''}
              `}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold
                  ${state === 'done' ? 'bg-blue-600 text-white' : ''}
                  ${state === 'active' ? 'bg-white text-blue-600' : ''}
                  ${state === 'pending' ? 'bg-slate-200 text-slate-400' : ''}
                `}>
                  {state === 'done' ? '✓' : i + 1}
                </span>
                {label}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-1 h-px w-8 ${i < current ? 'bg-blue-300' : 'bg-slate-200'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
