interface Props {
  text: string
}

export default function ValueStory({ text }: Props) {
  const match = text.match(/^(As a )([^,]+)(,.*)$/s)
  if (!match) return <p className="text-sm text-gray-500 italic">{text}</p>

  const [, prefix, persona, rest] = match
  return (
    <p className="text-sm text-gray-500 italic">
      {prefix}<strong className="font-semibold not-italic text-gray-700">{persona}</strong>{rest}
    </p>
  )
}
