import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { autoAssignUsersToTeams } from '@/lib/domainUtils'
import { broadcastEvent } from '../../events/route'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    // Get the session to check if the user is an admin
    const session = await getServerSession(authOptions)
    
    // Check if the user is authorized (is an admin)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Auto-assign users to teams
    const result = await autoAssignUsersToTeams()
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to auto-assign teams' },
        { status: 500 }
      )
    }
    
    // Get all teams with assigned users to broadcast
    const teamsWithUsers = await prisma.team.findMany({
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
    
    // Broadcast team assignment event
    broadcastEvent({
      type: 'team-assigned',
      data: {
        teams: teamsWithUsers,
        message: 'Teams have been assigned!'
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error auto-assigning teams:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 