import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const config = await (prisma as any).config.findUnique({
      where: { id: 'singleton' },
      select: {
        deadline: true, 
        eventStarted: true,
        eventEnded: true
      }
    })
    
    if (!config) {
      return NextResponse.json({
        deadline: null,
        eventStarted: false,
        eventEnded: false
      })
    }
    
    return NextResponse.json(config)
  } catch (error) {
    console.error("Error fetching config:", error)
    return NextResponse.json({
      deadline: null,
      eventStarted: false,
      eventEnded: false
    })
  }
} 