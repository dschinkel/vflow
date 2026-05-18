interface Props {
  stickyText: string | null
}

export default function SuggestionBarContent({ stickyText }: Props) {
  if (!stickyText) return <span className="suggestion__empty">All stickies done.</span>
  return (
    <span className="suggestion__text">
      Suggested next: <strong>{stickyText}</strong>
    </span>
  )
}
