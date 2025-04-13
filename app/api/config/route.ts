import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    // Allow public access to config info, but limit what's exposed
    const config = await (prisma as any).config.findUnique({
      where: { id: 'singleton' },
      select: {
        deadline: true, 
        eventStarted: true,
        eventEnded: true
      }
    })
    
    if (!config) {
      // If no config found, return empty but valid response
      return NextResponse.json({
        deadline: null,
        eventStarted: false,
        eventEnded: false
      })
    }
    
    return NextResponse.json(config)
  } catch (error) {
    console.error("Error fetching config:", error)
    // Return a valid response even on error to prevent dashboard crashes
    return NextResponse.json({
      deadline: null,
      eventStarted: false,
      eventEnded: false
    })
  }
} 