// components/MiniMap.tsx
export default function MiniMap({ impact, uncertainty }: { impact: number; uncertainty: number }) {
    return (
      <div className="flex flex-col items-start text-xs text-gray-500">
        <div className="flex items-start">
          <div className="flex flex-col justify-between h-24 mr-2">
            {[5, 4, 3, 2, 1].map((i) => (
              <div key={`impact-${i}`} className="h-5 text-right pr-1">{i}</div>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-1 bg-gray-100 p-1 rounded border">
            {[5, 4, 3, 2, 1].map((i) =>
              [1, 2, 3, 4, 5].map((u) => {
                const active = i === impact && u === uncertainty
                return (
                  <div
                    key={`${i}-${u}`}
                    className={`h-4 w-4 rounded-sm ${active ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    title={`影響度 ${i} / 不確実性 ${u}`}
                  />
                )
              })
            )}
          </div>
        </div>
        <div className="ml-6 mt-1 flex justify-between w-[80px]">
          {[1, 2, 3, 4, 5].map((u) => (
            <div key={`uncertainty-${u}`}>{u}</div>
          ))}
        </div>
        <div className="ml-6 text-xs mt-1">← 不確実性</div>
        <div className="text-xs mt-1">↑ 影響度</div>
      </div>
    )
  }
  