import type { Activity } from '../../types'

interface Props {
  title: string
  activities: Activity[]
}

function countStickies(activities: Activity[]) {
  const all = activities.flatMap(a => a.stickies).filter(s => s.state !== 'deferred')
  return {
    total: all.length,
    done: all.filter(s => s.state === 'done').length,
    active: all.filter(s => s.state === 'active' || s.state === 'streaming').length,
  }
}

export default function FeatureBanner({ title, activities }: Props) {
  const { total, done, active } = countStickies(activities)

  return (
    <header className="pt-5 pb-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Feature</span>
        <span className="text-xs font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">/feature</span>
        <span className="text-xs text-gray-400">
          {done} of {total} done
          {active > 0 && <> · <span className="text-blue-500">{active} active</span></>}
        </span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 leading-tight">{title}</h1>
    </header>
  )
}
