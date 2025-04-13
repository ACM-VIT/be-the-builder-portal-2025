import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Bell } from 'lucide-react'

export type NotificationType = 'success' | 'error' | 'info'

export interface NotificationProps {
  type: NotificationType
  title: string
  message: string
  duration?: number
  onClose?: () => void
}

export function Notification({ 
  type, 
  title, 
  message, 
  duration = 5000, 
  onClose 
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true)
  
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [duration])
  
  const handleClose = () => {
    setIsVisible(false)
    if (onClose) onClose()
  }
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-emerald-500" />
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-500" />
      case 'info':
      default:
        return <Bell className="h-6 w-6 text-blue-500" />
    }
  }
  
  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-100 border-emerald-200'
      case 'error':
        return 'bg-red-100 border-red-200'
      case 'info':
      default:
        return 'bg-blue-100 border-blue-200'
    }
  }
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`rounded-lg shadow-lg border ${getBgColor()} p-4 max-w-md w-full pointer-events-auto`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-gray-900">{title}</h3>
              <div className="mt-1 text-sm text-gray-700">
                {message}
              </div>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={handleClose}
                className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span className="sr-only">Close</span>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Component for managing multiple notifications
export interface NotificationItem extends NotificationProps {
  id: string
}

export function NotificationManager() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  
  const addNotification = (notification: Omit<NotificationItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setNotifications(prev => [...prev, { ...notification, id }])
    return id
  }
  
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }
  
  return {
    notifications,
    addNotification,
    removeNotification,
    NotificationList: () => (
      <div className="fixed top-4 right-4 z-50 space-y-4 pointer-events-none">
        <AnimatePresence>
          {notifications.map(notification => (
            <Notification
              key={notification.id}
              {...notification}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    )
  }
} 