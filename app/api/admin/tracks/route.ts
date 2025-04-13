import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // Get the session to check if the user is an admin
    const session = await getServerSession(authOptions)
    
    // Check if the user is authorized (is an admin)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Fetch all tracks
    const tracks = await prisma.track.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { teams: true }
        }
      }
    })
    
    return NextResponse.json(tracks)
  } catch (error) {
    console.error('Error fetching tracks:', error)
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
    
    const { name, description, color } = await request.json()
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Track name is required' }, { status: 400 })
    }
    
    // Create a new track
    const track = await prisma.track.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || null
      }
    })
    
    return NextResponse.json(track)
  } catch (error) {
    console.error('Error creating track:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get the session to check if the user is an admin
    const session = await getServerSession(authOptions)
    
    // Check if the user is authorized (is an admin)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id, name, description, color } = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 })
    }
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Track name is required' }, { status: 400 })
    }
    
    // Update the track
    const track = await prisma.track.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || null
      }
    })
    
    return NextResponse.json(track)
  } catch (error) {
    console.error('Error updating track:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get the session to check if the user is an admin
    const session = await getServerSession(authOptions)
    
    // Check if the user is authorized (is an admin)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 })
    }
    
    // First, update any teams that have this track to remove the trackId
    await prisma.team.updateMany({
      where: { trackId: id },
      data: { trackId: null }
    })
    
    // Then delete the track
    await prisma.track.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting track:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 