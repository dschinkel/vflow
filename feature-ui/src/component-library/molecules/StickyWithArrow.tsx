import type { StickyState } from '../../types'
import ArrowUp from '../atoms/ArrowUp'
import Sticky from '../atoms/Sticky'

interface Props {
  text: string
  state: StickyState
}

export default function StickyWithArrow({ text, state }: Props) {
  return (
    <div className="sticky-with-arrow">
      <ArrowUp />
      <Sticky text={text} state={state} />
    </div>
  )
}
