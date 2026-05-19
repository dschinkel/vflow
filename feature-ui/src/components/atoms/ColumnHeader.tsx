interface Props {
  index: number
  name: string
}

export default function ColumnHeader({ index, name }: Props) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
      <span className="text-xs font-bold text-amber-400">A{index + 1}</span>
      <span className="text-sm font-semibold text-gray-800">{name}</span>
    </div>
  )
}
