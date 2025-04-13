import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  titleClassName?: string
}

export function Card({ 
  children, 
  className = '', 
  title, 
  titleClassName = '' 
}: CardProps) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-6 shadow-md hover:shadow-lg transition-shadow duration-300 ${className}`}>
      {title && (
        <h3 className={`mb-4 text-xl font-semibold text-gray-800 ${titleClassName}`}>
          {title}
        </h3>
      )}
      {children}
    </div>
  )
} 