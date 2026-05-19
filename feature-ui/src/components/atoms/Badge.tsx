import type { StickyState } from '../../types'
import { cn } from '../../lib/utils'

interface Props {
  state: StickyState
}

const labels: Partial<Record<StickyState, string>> = {
  active: 'Active',
  streaming: 'Streaming',
  done: 'Done',
  deferred: 'Deferred',
}

export default function Badge({ state }: Props) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
      state === 'active' && 'bg-blue-100 text-blue-700',
      state === 'streaming' && 'bg-purple-100 text-purple-700',
      state === 'done' && 'bg-green-100 text-green-700',
      state === 'deferred' && 'bg-gray-100 text-gray-500',
    )}>
      {labels[state] ?? state}
    </span>
  )
}
