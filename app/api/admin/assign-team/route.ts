import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/options'

export async function POST(request: NextRequest) {
  try {
    // Get the session to check if the user is an admin
    const session = await getServerSession(authOptions)
    
    // Check if the user is authorized (is an admin)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { userId, teamId } = await request.json()
    
    // Validate input
    if (!userId || !teamId) {
      return NextResponse.json({ error: 'Missing userId or teamId' }, { status: 400 })
    }
    
    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { teamId: teamId },
    })
    
    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error('Error assigning team:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 