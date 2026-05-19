import SuggestionBarContent from '../molecules/SuggestionBarContent'

interface Props {
  stickyText: string | null
}

export default function SuggestionBar({ stickyText }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 my-2 flex items-center gap-2">
      <SuggestionBarContent stickyText={stickyText} />
    </div>
  )
}
