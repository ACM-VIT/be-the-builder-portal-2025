import { useEffect, useState, useRef, useCallback } from 'react'

export type EventType = 
  | 'team-assigned' 
  | 'team-updated' 
  | 'idea-submitted'
  | 'deadline-updated'
  | 'event-started'
  | 'event-ended'
  | 'connected';

export type EventData = {
  type: EventType;
  data?: any;
  message?: string;
};

export type EventHandler = (event: EventData) => void;

export function useEvents() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<EventData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const handlersRef = useRef<Map<EventType, Set<EventHandler>>>(new Map())
  
  // Connect to the SSE endpoint
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    
    try {
      const eventSource = new EventSource('/api/events')
      eventSourceRef.current = eventSource
      
      eventSource.onopen = () => {
        setIsConnected(true)
        setError(null)
      }
      
      eventSource.onerror = (err) => {
        setIsConnected(false)
        setError('Connection to server failed. Reconnecting...')
        console.error('EventSource error:', err)
        
        // Try to reconnect after a delay
        setTimeout(() => {
          eventSource.close()
          connect()
        }, 3000)
      }
      
      eventSource.onmessage = (event) => {
        try {
          const eventData = JSON.parse(event.data) as EventData
          setLastEvent(eventData)
          
          // Find and call handlers for this event type
          const handlers = handlersRef.current.get(eventData.type)
          if (handlers) {
            handlers.forEach(handler => handler(eventData))
          }
          
          // If it's a connected event, make sure we set the state
          if (eventData.type === 'connected') {
            setIsConnected(true)
          }
        } catch (err) {
          console.error('Error parsing event data:', err)
        }
      }
      
      return () => {
        eventSource.close()
        eventSourceRef.current = null
      }
    } catch (err) {
      setError('Failed to connect to the server')
      console.error('Error connecting to events:', err)
      return undefined
    }
  }, [])
  
  // Register a handler for a specific event type
  const on = useCallback((eventType: EventType, handler: EventHandler) => {
    if (!handlersRef.current.has(eventType)) {
      handlersRef.current.set(eventType, new Set())
    }
    
    const handlers = handlersRef.current.get(eventType)!
    handlers.add(handler)
    
    // Return a function to unregister the handler
    return () => {
      handlers.delete(handler)
      if (handlers.size === 0) {
        handlersRef.current.delete(eventType)
      }
    }
  }, [])
  
  // Remove all handlers for a specific event type
  const off = useCallback((eventType: EventType) => {
    handlersRef.current.delete(eventType)
  }, [])
  
  // Connect to the events when the component mounts
  useEffect(() => {
    const cleanup = connect()
    
    // Clean up the event source when the component unmounts
    return () => {
      if (cleanup) cleanup()
    }
  }, [connect])
  
  return {
    isConnected,
    lastEvent,
    error,
    on,
    off
  }
}

// A simpler hook for components that just need to listen for specific events
export function useEventListener(eventType: EventType, handler: EventHandler) {
  const { on } = useEvents()
  
  useEffect(() => {
    const cleanup = on(eventType, handler)
    return cleanup
  }, [on, eventType, handler])
} 