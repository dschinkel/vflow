import type { StickyItem } from '../../types'
import ColumnHeader from '../atoms/ColumnHeader'
import Sticky from '../atoms/Sticky'
import StickyWithArrow from '../molecules/StickyWithArrow'

interface Props {
  index: number
  name: string
  stickies: StickyItem[]
}

export default function ActivityColumn({ index, name, stickies }: Props) {
  return (
    <div className="min-w-[220px] flex flex-col gap-2">
      <ColumnHeader index={index} name={name} />
      <div className="flex flex-col">
        {stickies.map((s, i) =>
          i === 0
            ? <Sticky key={s.text} text={s.text} state={s.state} />
            : <StickyWithArrow key={s.text} text={s.text} state={s.state} />
        )}
      </div>
    </div>
  )
}
