import { NextRequest, NextResponse } from 'next/server'
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
    
    // Fetch teams
    const teams = await prisma.team.findMany({
      select: { id: true, name: true },
    })
    
    return NextResponse.json(teams)
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the session to check if the user is an admin
    const session = await getServerSession(authOptions)
    
    // Check if the user is authorized (is an admin)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { name } = await request.json()
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 })
    }
    
    // Create a new team
    const team = await prisma.team.create({
      data: {
        name: name.trim()
      }
    })
    
    return NextResponse.json(team)
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 