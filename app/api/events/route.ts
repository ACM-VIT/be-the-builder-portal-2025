import { NextRequest, NextResponse } from "next/server";
import { clients, broadcastEvent, type EventData } from "@/lib/eventUtils";

export async function GET(req: NextRequest) {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  };

  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);

      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      req.signal.addEventListener('abort', () => {
        clients.delete(controller);
      });
    }
  });

  return new NextResponse(stream, { headers });
}

export async function POST(req: NextRequest) {
  try {
    const eventData = await req.json() as EventData;
    
    if (!eventData || !eventData.type) {
      return NextResponse.json({ error: 'Invalid event data' }, { status: 400 });
    }
    
    broadcastEvent(eventData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error broadcasting event:', error);
    return NextResponse.json({ error: 'Failed to broadcast event' }, { status: 500 });
  }
}
