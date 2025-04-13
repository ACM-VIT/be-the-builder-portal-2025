import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/options"
import prisma from "@/lib/prisma"
import { broadcastEvent } from "../../events/route"

export async function PUT(req: NextRequest) {
  try {
    // Check if user is authenticated and has a team
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    if (!session.user.teamId) {
      return NextResponse.json(
        { error: "You are not assigned to a team" },
        { status: 400 }
      )
    }
    
    // Get and validate the new team name
    const { name } = await req.json()
    
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return NextResponse.json(
        { error: "Team name must be at least 3 characters" },
        { status: 400 }
      )
    }
    
    // Update the team name
    const updatedTeam = await prisma.team.update({
      where: { id: session.user.teamId },
      data: { name: name.trim() },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            domain: true
          }
        }
      }
    })
    
    // Broadcast team update event
    broadcastEvent({
      type: 'team-updated',
      data: {
        team: updatedTeam,
        message: `Team name has been updated to "${name}"`
      }
    })
    
    return NextResponse.json({
      success: true,
      team: updatedTeam
    })
  } catch (error) {
    console.error('Error updating team name:', error)
    return NextResponse.json(
      { error: "Failed to update team name" },
      { status: 500 }
    )
  }
} 