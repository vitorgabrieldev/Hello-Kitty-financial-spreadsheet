export default function NewTransactionLoading() {
  return (
    <div>
      {/* Header */}
      <div
        className="px-4 pt-12 pb-4 flex items-center gap-3"
        style={{ background: 'rgba(255,255,255,0.75)', borderBottom: '1px solid #FFE8F1' }}
      >
        <div className="skeleton w-8 h-8 rounded-full" />
        <div className="skeleton h-5 w-36 rounded-full" />
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Tipo (receita/despesa) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="skeleton h-12 rounded-2xl" />
          <div className="skeleton h-12 rounded-2xl" />
        </div>
        {/* Campos */}
        {[120, 52, 52, 52, 52, 52].map((h, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="skeleton h-3 w-24 rounded-full" />
            <div className="skeleton rounded-xl" style={{ height: h }} />
          </div>
        ))}
        {/* Botão */}
        <div className="skeleton h-12 rounded-2xl mt-2" />
      </div>
    </div>
  )
}
