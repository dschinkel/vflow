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
    <div className="activity-column">
      <ColumnHeader index={index} name={name} />
      <div className="activity-column__stickies">
        {stickies.map((s, i) =>
          i === 0
            ? <Sticky key={s.text} text={s.text} state={s.state} />
            : <StickyWithArrow key={s.text} text={s.text} state={s.state} />
        )}
      </div>
    </div>
  )
}
