'use client'

import { useEffect, useState } from 'react'

const MESSAGES = [
  'Analysing job description...',
  'Calculating materials and quantities...',
  'Pricing labour and plant hire...',
  'Generating scope of work...',
  'Applying your margin settings...',
  'Finalising your quote...',
]

export function GeneratingStep() {
  const [messageIndex, setMessageIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length)
    }, 2500)

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 1.5, 95))
    }, 200)

    return () => {
      clearInterval(msgInterval)
      clearInterval(progressInterval)
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="relative w-24 h-24 mb-8">
        <div className="w-24 h-24 rounded-full border-4 border-border" />
        <div
          className="absolute top-0 left-0 w-24 h-24 rounded-full border-4 border-gold border-t-transparent animate-spin"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center">
            <span className="text-white font-bold text-sm">Q</span>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2">Generating your quote</h2>
      <p className="text-muted-foreground text-sm mb-8 h-5 transition-all duration-500">
        {MESSAGES[messageIndex]}
      </p>

      <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gold rounded-full transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground mt-2">{Math.round(progress)}%</div>
    </div>
  )
}
