import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/options'
import prisma from '@/lib/prisma'
import { broadcastEvent } from '@/lib/eventUtils'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { teamId, trackId } = await request.json()
    
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }
    
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: { 
        trackId: trackId || null 
      },
      include: {
        track: true,
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
      type: 'team-updated',
      data: {
        team: updatedTeam,
        message: updatedTeam.track 
          ? `Your team has been assigned to the "${updatedTeam.track.name}" track` 
          : `Your team's track has been removed`
      }
    })
    
    return NextResponse.json({
      success: true,
      team: updatedTeam
    })
  } catch (error) {
    console.error('Error assigning track:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}