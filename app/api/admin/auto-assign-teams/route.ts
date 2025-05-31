import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/options'
import prisma from '@/lib/prisma'
import { broadcastEvent } from '@/lib/eventUtils'
import { autoAssignUsersToTeams } from '@/lib/domainUtils'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const result = await autoAssignUsersToTeams()
    if (!result) {
      return NextResponse.json({ error: 'Failed to auto-assign teams' }, { status: 500 })
    }
    
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