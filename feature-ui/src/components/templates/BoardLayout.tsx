import type { Activity } from '../../types'
import GridBackground from '../atoms/GridBackground'
import ValueStory from '../atoms/ValueStory'
import FeatureBanner from '../organisms/FeatureBanner'
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
      <FeatureBanner title={title} activities={activities} />
      {valueStory && <div className="-mt-1 mb-2"><ValueStory text={valueStory} /></div>}
      <SuggestionBar stickyText={suggestedNextText} />
      <div className="flex gap-4 items-start pt-4 overflow-x-auto">
        {activities.map((a, i) => (
          <ActivityColumn key={a.name} index={i} name={a.name} stickies={a.stickies} />
        ))}
      </div>
    </div>
  )
}
