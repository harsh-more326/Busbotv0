"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface MovingGradientProps {
  className?: string
  children?: React.ReactNode
  speed?: number
  colors?: string[]
}

export function MovingGradient({
  className,
  children,
  speed = 4,
  colors = ["#c026d3", "#8b5cf6", "#6366f1"],
}: MovingGradientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrapper = wrapperRef.current
    if (!canvas || !wrapper) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let time = 0

    const resizeCanvas = () => {
      canvas.width = wrapper.offsetWidth
      canvas.height = wrapper.offsetHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const animate = () => {
      time += 0.003 * speed

      const width = canvas.width
      const height = canvas.height

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Create gradient
      const gradient = ctx.createLinearGradient(
        width * Math.sin(time) * 0.5 + width * 0.5,
        height * Math.cos(time) * 0.5 + height * 0.5,
        width * Math.sin(time + Math.PI) * 0.5 + width * 0.5,
        height * Math.cos(time + Math.PI) * 0.5 + height * 0.5,
      )

      colors.forEach((color, index) => {
        gradient.addColorStop(index / (colors.length - 1), color)
      })

      // Fill canvas with gradient
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [speed, colors])

  return (
    <div ref={wrapperRef} className={cn("relative overflow-hidden", className)}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-80" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

