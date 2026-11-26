import { Braces } from 'lucide-react'

export function CodeMatchMark({ size = 17 }: { size?: number }) {
  return <span className="brand-mark" aria-hidden="true"><Braces size={size} strokeWidth={2.5} /></span>
}
