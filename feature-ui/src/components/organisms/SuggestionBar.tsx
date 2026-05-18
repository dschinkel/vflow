import SuggestionBarContent from '../molecules/SuggestionBarContent'

interface Props {
  stickyText: string | null
}

export default function SuggestionBar({ stickyText }: Props) {
  return (
    <div className="suggestion-bar">
      <SuggestionBarContent stickyText={stickyText} />
    </div>
  )
}
