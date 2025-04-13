import { NextRequest, NextResponse } from "next/server";

// Store active connections
const clients = new Set<ReadableStreamController<Uint8Array>>();

// Types of events
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

// Broadcast an event to all connected clients
export function broadcastEvent(event: EventData) {
  const eventString = `data: ${JSON.stringify(event)}\n\n`;
  const encoder = new TextEncoder();
  
  clients.forEach((client) => {
    client.enqueue(encoder.encode(eventString));
  });
}

export async function GET(req: NextRequest) {
  // Set up SSE headers
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  };

  // Create a readable stream
  const stream = new ReadableStream({
    start(controller) {
      // Add this client to the set
      clients.add(controller);

      // Send an initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      // Remove the client when they disconnect
      req.signal.addEventListener('abort', () => {
        clients.delete(controller);
      });
    }
  });

  return new NextResponse(stream, { headers });
}

export async function POST(req: NextRequest) {
  try {
    // Only allow admins to broadcast events via this endpoint
    // In a production app, you'd want more robust authentication here
    
    const eventData = await req.json() as EventData;
    
    if (!eventData || !eventData.type) {
      return NextResponse.json({ error: 'Invalid event data' }, { status: 400 });
    }
    
    // Broadcast the event to all connected clients
    broadcastEvent(eventData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error broadcasting event:', error);
    return NextResponse.json({ error: 'Failed to broadcast event' }, { status: 500 });
  }
} 