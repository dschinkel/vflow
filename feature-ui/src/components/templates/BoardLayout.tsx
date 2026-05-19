import type { Activity } from '../../types'
import GridBackground from '../atoms/GridBackground'
import SuggestionBar from '../organisms/SuggestionBar'
import ActivityColumn from '../organisms/ActivityColumn'

interface Props {
  title: string
  valueStory: string | null
  activities: Activity[]
  suggestedNextText: string | null
}

export default function BoardLayout({ title, valueStory, activities, suggestedNextText }: Props) {
  return (
    <div className="relative z-10 px-6 pb-8 min-h-screen">
      <GridBackground />
      <header className="pt-5 pb-2">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {valueStory && <p className="text-sm text-gray-500 mt-1 italic">{valueStory}</p>}
      </header>
      <SuggestionBar stickyText={suggestedNextText} />
      <div className="flex gap-4 items-start pt-4 overflow-x-auto">
        {activities.map((a, i) => (
          <ActivityColumn key={a.name} index={i} name={a.name} stickies={a.stickies} />
        ))}
      </div>
    </div>
  )
}
