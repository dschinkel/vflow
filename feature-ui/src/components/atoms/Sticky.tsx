import type { StickyState } from '../../types'
import { cn } from '../../lib/utils'
import Badge from './Badge'
import Checkbox from './Checkbox'

interface Props {
  text: string
  state: StickyState
}

export default function Sticky({ text, state }: Props) {
  return (
    <div className={cn(
      'relative bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2.5 min-w-[200px] text-sm flex flex-col gap-1.5 overflow-hidden',
      state === 'active' && 'ring-2 ring-blue-400 animate-[pulse-ring_1.5s_ease-in-out_infinite]',
      state === 'streaming' && 'ring-2 ring-purple-400',
      (state === 'done' || state === 'deferred') && 'opacity-60',
    )}>
      <div className="flex items-center gap-1.5">
        {state === 'done' && <Checkbox />}
        {(state === 'active' || state === 'streaming') && <Badge state={state} />}
        <span className={cn(
          'flex-1 text-gray-800',
          (state === 'done' || state === 'deferred') && 'line-through text-gray-400',
        )}>
          {text}
        </span>
      </div>
      {state === 'active' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-200 overflow-hidden">
          <div className="h-full w-1/2 bg-blue-400 animate-[shimmer_1.5s_ease-in-out_infinite]" />
        </div>
      )}
      {state === 'streaming' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-200 overflow-hidden">
          <div className="h-full w-1/3 bg-purple-400 animate-[shimmer_1.2s_linear_infinite]" />
        </div>
      )}
    </div>
  )
}
