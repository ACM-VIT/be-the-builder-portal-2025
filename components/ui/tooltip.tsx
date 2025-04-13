import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TooltipProps {
  children: React.ReactNode
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ 
  children, 
  content, 
  position = 'top' 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  
  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return 'bottom-full mb-2 left-1/2 transform -translate-x-1/2'
      case 'bottom':
        return 'top-full mt-2 left-1/2 transform -translate-x-1/2'
      case 'left':
        return 'right-full mr-2 top-1/2 transform -translate-y-1/2'
      case 'right':
        return 'left-full ml-2 top-1/2 transform -translate-y-1/2'
      default:
        return 'bottom-full mb-2 left-1/2 transform -translate-x-1/2'
    }
  }
  
  return (
    <div 
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 whitespace-nowrap px-3 py-1.5 rounded bg-gray-900 text-white text-sm pointer-events-none ${getPositionStyles()}`}
          >
            {content}
            <div 
              className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
                position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
                position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
                position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
                'left-[-4px] top-1/2 -translate-y-1/2'
              }`}
            ></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 