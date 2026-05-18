import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import ViewStoryMap from './ViewStoryMap'
import type { StoryMapState } from '../types'

const baseState: StoryMapState = {
  title: 'Payments Flow',
  valueStory: 'As a buyer, I want to pay.',
  activeStickyText: null,
  activities: [
    {
      name: 'Checkout',
      stickies: [
        { text: 'Proceed to checkout', state: 'todo' },
        { text: 'Enter card details', state: 'todo' },
      ],
    },
  ],
}

function makeFakeEventSource() {
  let listener: ((e: { data: string }) => void) | null = null
  const es = {
    get onmessage() { return listener },
    set onmessage(fn) { listener = fn },
    close: vi.fn(),
    emit(s: StoryMapState) { listener?.({ data: JSON.stringify(s) }) },
  }
  vi.stubGlobal('EventSource', vi.fn().mockReturnValue(es))
  return es
}

beforeEach(() => { vi.restoreAllMocks() })

describe('ViewStoryMap', () => {
  it('shows a loading indicator before the board state arrives', () => {
    makeFakeEventSource()
    render(<ViewStoryMap />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders the feature title once the board state arrives', () => {
    const es = makeFakeEventSource()
    render(<ViewStoryMap />)
    act(() => { es.emit(baseState) })
    expect(screen.getByRole('heading', { name: 'Payments Flow' })).toBeInTheDocument()
  })

  it('renders the value story', () => {
    const es = makeFakeEventSource()
    render(<ViewStoryMap />)
    act(() => { es.emit(baseState) })
    expect(screen.getByText('As a buyer, I want to pay.')).toBeInTheDocument()
  })

  it('shows the first uncompleted sticky as the suggested next sticky', () => {
    const es = makeFakeEventSource()
    render(<ViewStoryMap />)
    act(() => { es.emit(baseState) })
    expect(screen.getAllByText('Proceed to checkout').length).toBeGreaterThan(0)
  })

  it('marks the active sticky with the NOW badge when activeStickyText is set', () => {
    const es = makeFakeEventSource()
    render(<ViewStoryMap />)
    act(() => { es.emit({ ...baseState, activeStickyText: 'Enter card details' }) })
    expect(screen.getByText('▶ NOW')).toBeInTheDocument()
  })

  it('closes the board stream connection when unmounted', () => {
    const es = makeFakeEventSource()
    const { unmount } = render(<ViewStoryMap />)
    unmount()
    expect(es.close).toHaveBeenCalledOnce()
  })
})
