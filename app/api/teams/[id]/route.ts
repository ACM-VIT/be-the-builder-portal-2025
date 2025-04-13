import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/options"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"

type TeamWithUsers = Prisma.TeamGetPayload<{
  include: {
    users: {
      select: {
        id: true
        name: true
        email: true
        image: true
        domain: true
      }
    }
  }
}>

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Get team data with users
    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            domain: true,
          }
        }
      }
    }) as TeamWithUsers | null
    
    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      )
    }
    
    // Only allow team members or admins to view team data
    const isTeamMember = team.users.some(user => user.id === session.user.id)
    const isAdmin = session.user.isAdmin
    
    if (!isTeamMember && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - You are not a member of this team" },
        { status: 403 }
      )
    }
    
    return NextResponse.json(team)
  } catch (error) {
    console.error("Error fetching team:", error)
    return NextResponse.json(
      { error: "Failed to fetch team data" },
      { status: 500 }
    )
  }
} 