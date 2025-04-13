import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/prisma"
import { broadcastEvent } from "../../events/route"
import { Prisma } from "@prisma/client"

export async function POST(req: NextRequest) {
  try {
    // Check if user is an admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }
    
    // Get deadline data
    const { deadline } = await req.json()
    
    // Validate the deadline
    let deadlineDate: Date | null = null
    
    if (deadline) {
      try {
        deadlineDate = new Date(deadline)
        if (isNaN(deadlineDate.getTime())) {
          throw new Error("Invalid date")
        }
      } catch (e) {
        return NextResponse.json(
          { error: "Invalid deadline date" },
          { status: 400 }
        )
      }
    }
    
    // Create or update the config
    const config = await (prisma as any).config.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        deadline: deadlineDate,
        teamSize: 5,
        eventStarted: false,
        eventEnded: false
      },
      update: {
        deadline: deadlineDate
      }
    })
    
    // Broadcast deadline update event
    broadcastEvent({
      type: 'deadline-updated',
      data: {
        deadline: deadlineDate,
        message: deadlineDate 
          ? `Submission deadline has been set to ${deadlineDate.toLocaleString()}`
          : "Submission deadline has been removed"
      }
    })
    
    return NextResponse.json({
      success: true,
      config
    })
  } catch (error) {
    console.error('Error setting deadline:', error)
    return NextResponse.json(
      { error: "Failed to set deadline" },
      { status: 500 }
    )
  }
} 