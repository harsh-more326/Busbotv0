"use client"

import type React from "react"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface GlowingBorderProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
  borderWidth?: number
}

export function GlowingBorder({
  children,
  className,
  glowColor = "rgba(139, 92, 246, 0.5)",
  borderWidth = 2,
}: GlowingBorderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      ref={containerRef}
      className={cn("relative rounded-xl transition-all duration-300", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        boxShadow: isHovered ? `0 0 20px ${glowColor}` : "none",
      }}
    >
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          background: `linear-gradient(45deg, #c026d3, #8b5cf6)`,
          padding: borderWidth,
          opacity: isHovered ? 1 : 0.5,
          transition: "opacity 0.3s ease",
        }}
      />
      <div className="relative bg-background rounded-xl overflow-hidden">{children}</div>
    </div>
  )
}

