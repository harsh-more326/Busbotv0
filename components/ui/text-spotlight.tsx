"use client"

import type React from "react"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface TextSpotlightProps {
  children: React.ReactNode
  className?: string
}

export function TextSpotlight({ children, className }: TextSpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setOpacity(1)
  }

  const handleMouseLeave = () => {
    setOpacity(0)
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative z-10 pointer-events-none">{children}</div>
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${position.x}px ${position.y}px, rgba(139, 92, 246, 0.3) 0%, transparent 50%)`,
          opacity,
        }}
      />
    </div>
  )
}

