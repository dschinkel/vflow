interface Props {
  stickyText: string | null
}

export default function SuggestionBarContent({ stickyText }: Props) {
  if (!stickyText) return <span className="text-gray-400 text-sm">All stickies done.</span>
  return (
    <span className="text-sm text-gray-500">
      Suggested next: <strong className="font-semibold text-blue-600">{stickyText}</strong>
    </span>
  )
}
