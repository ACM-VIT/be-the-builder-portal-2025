"use client"

import React from 'react'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  indicatorClassName?: string
}

export function Progress({
  value,
  max = 100,
  className = '',
  indicatorClassName = ''
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  return (
    <div
      className={`h-2 w-full bg-gray-200 rounded-full overflow-hidden ${className}`}
    >
      <div
        className={`h-full bg-indigo-600 transition-all duration-300 ${indicatorClassName}`}
        style={{ width: `${percentage}%` }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  )
}
