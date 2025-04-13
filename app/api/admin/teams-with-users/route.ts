import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET() {
  try {
    // Get the session to check if the user is an admin
    const session = await getServerSession(authOptions)
    
    // Check if the user is authorized (is an admin)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Fetch teams with their users
    const teams = await prisma.team.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            domain: true,
            teamId: true
          }
        }
      }
    })
    
    // Calculate domain counts for each team
    const teamsWithStats = teams.map(team => {
      const domainCounts: Record<string, number> = {}
      
      team.users.forEach(user => {
        if (user.domain) {
          domainCounts[user.domain] = (domainCounts[user.domain] || 0) + 1
        }
      })
      
      return {
        ...team,
        domainCounts,
        totalMembers: team.users.length
      }
    })
    
    return NextResponse.json(teamsWithStats)
  } catch (error) {
    console.error('Error fetching teams with users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 