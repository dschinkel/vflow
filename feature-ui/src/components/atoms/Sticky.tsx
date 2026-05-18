import type { StickyState } from '../../types'
import Badge from './Badge'
import Checkbox from './Checkbox'

interface Props {
  text: string
  state: StickyState
}

export default function Sticky({ text, state }: Props) {
  return (
    <div className={`sticky sticky--${state}`}>
      {state === 'done' && <Checkbox />}
      {state === 'active' && <Badge />}
      <span className="sticky__text">{text}</span>
    </div>
  )
}
