import React, { createContext, useContext, ReactNode } from 'react'
import { NotificationManager, NotificationItem, NotificationType } from '@/components/notification'

type NotificationContextType = {
  notify: (title: string, message: string, type?: NotificationType, duration?: number) => string
  removeNotification: (id: string) => void
  notifications: NotificationItem[]
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { 
    addNotification, 
    removeNotification, 
    notifications, 
    NotificationList 
  } = NotificationManager()
  
  const notify = (
    title: string, 
    message: string, 
    type: NotificationType = 'info',
    duration = 5000
  ) => {
    return addNotification({ title, message, type, duration })
  }
  
  return (
    <NotificationContext.Provider 
      value={{ 
        notify, 
        removeNotification, 
        notifications 
      }}
    >
      {children}
      <NotificationList />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  
  return context
} 