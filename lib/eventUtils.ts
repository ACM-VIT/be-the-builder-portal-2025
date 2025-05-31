export const clients = new Set<ReadableStreamController<Uint8Array>>();

export type EventType = 
  | 'team-assigned' 
  | 'team-updated' 
  | 'idea-submitted'
  | 'deadline-updated'
  | 'event-started'
  | 'event-ended';

export type EventData = {
  type: EventType;
  data: any;
};

export function broadcastEvent(event: EventData) {
  const eventString = `data: ${JSON.stringify(event)}\n\n`;
  const encoder = new TextEncoder();

  clients.forEach((client) => {
    client.enqueue(encoder.encode(eventString));
  });
}