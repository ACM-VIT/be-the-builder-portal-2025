// Store active connections
export const clients = new Set<ReadableStreamController<Uint8Array>>();

// Allowed event types
export type EventType = 
  | 'team-assigned' 
  | 'team-updated' 
  | 'idea-submitted'
  | 'deadline-updated'
  | 'event-started'
  | 'event-ended';

// Event data structure
export type EventData = {
  type: EventType;
  data: any;
};

// Helper: Broadcast an event to all connected clients
export function broadcastEvent(event: EventData) {
  const eventString = `data: ${JSON.stringify(event)}\n\n`;
  const encoder = new TextEncoder();

  clients.forEach((client) => {
    client.enqueue(encoder.encode(eventString));
  });
}