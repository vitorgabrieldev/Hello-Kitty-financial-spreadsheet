interface Props {
  rows?: number
  hasBalance?: boolean
}

export default function ListPageSkeleton({ rows = 4, hasBalance = true }: Props) {
  return (
    <div>
      {/* PageHeader skeleton */}
      <div
        className="px-4 pt-12 pb-4 flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.75)', borderBottom: '1px solid #FFE8F1' }}
      >
        <div className="flex flex-col gap-2">
          <div className="skeleton h-5 w-24 rounded-full" />
          <div className="skeleton h-3 w-20 rounded-full" />
        </div>
        <div className="skeleton h-8 w-20 rounded-full" />
      </div>

      {/* Lista */}
      <div className="px-4 py-3 flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 flex items-center justify-between"
            style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid #FFE8F1' }}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="skeleton w-11 h-11 rounded-full flex-shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="skeleton h-3 rounded-full" style={{ width: `${55 + (i % 3) * 15}%` }} />
                <div className="skeleton h-2.5 rounded-full" style={{ width: `${35 + (i % 2) * 20}%` }} />
              </div>
            </div>
            {hasBalance && <div className="skeleton h-4 w-20 rounded-full ml-3" />}
          </div>
        ))}
      </div>
    </div>
  )
}
