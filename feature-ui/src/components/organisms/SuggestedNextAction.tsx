interface Props {
  stickyText: string | null
}

export default function SuggestedNextAction({ stickyText }: Props) {
  return (
    <div className="inline-flex items-start gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2.5 shadow-sm mb-4">
      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold mt-0.5 shrink-0">+</div>
      <div>
        <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-0.5">Suggested Next Action</p>
        {stickyText
          ? <p className="text-sm text-gray-800">Run <code className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-blue-600">/feature</code> · <span className="font-medium">{stickyText}</span></p>
          : <p className="text-sm text-gray-400">All stickies complete.</p>
        }
      </div>
    </div>
  )
}
