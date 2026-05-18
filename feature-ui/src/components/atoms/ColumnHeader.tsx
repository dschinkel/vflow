interface Props {
  index: number
  name: string
}

export default function ColumnHeader({ index, name }: Props) {
  return (
    <div className="column-header">
      <span className="column-header__index">{index + 1}</span>
      <span className="column-header__name">{name}</span>
    </div>
  )
}
