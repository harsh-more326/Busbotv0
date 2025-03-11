"use client"

import type React from "react"

import { useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface FloatingAnimationProps {
  children: React.ReactNode
  className?: string
  speed?: number
  amplitude?: number
  delay?: number
}

export function FloatingAnimation({
  children,
  className,
  speed = 3,
  amplitude = 10,
  delay = 0,
}: FloatingAnimationProps) {
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const startTime = Date.now() - delay * 1000
    let animationFrameId: number

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000
      const position = Math.sin(elapsed / speed) * amplitude

      element.style.transform = `translateY(${position}px)`

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [speed, amplitude, delay])

  return (
    <div ref={elementRef} className={cn("transition-transform", className)}>
      {children}
    </div>
  )
}

