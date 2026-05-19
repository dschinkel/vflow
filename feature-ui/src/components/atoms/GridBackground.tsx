export default function GridBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        backgroundColor: '#f8f7f4',
        backgroundImage: 'radial-gradient(circle, #d1cec8 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    />
  )
}
