"use client"

import { useEffect, useState } from "react"

export default function StarBackground() {
  const [stars, setStars] = useState<Array<{ x: number; y: number; duration: number }>>([])

  useEffect(() => {
    // Generate random stars
    const generatedStars = Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 3 + Math.random() * 4,
    }))
    setStars(generatedStars)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {stars.map((star, index) => (
        <div
          key={index}
          className="absolute bg-white rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: "1px",
            height: "1px",
            animation: `twinkle ${star.duration}s infinite`,
            opacity: 0.6,
          }}
        />
      ))}

      {/* Gradient orbs for ambient effect */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl opacity-20 animate-pulse" />
    </div>
  )
}
