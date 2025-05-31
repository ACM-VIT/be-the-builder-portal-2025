import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/options'
import { Prisma, PrismaClient } from '@prisma/client'
import prisma from '@/lib/prisma'
import { broadcastEvent } from '@/lib/eventUtils'

const _prismaCheck: PrismaClient = prisma

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const config = await (prisma as any).config.upsert({
      where: { id: 'singleton' },
      update: {},
      create: {
        id: 'singleton',
        teamSize: 5
      }
    })
    
    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const data = await request.json()
    const { teamSize, deadline, eventStarted, eventEnded, tracksEnabled } = data
    
    const updatedConfig = await (prisma as any).config.upsert({
      where: { id: 'singleton' },
      update: {
        ...(teamSize !== undefined && typeof teamSize === 'number' && teamSize >= 2 ? { teamSize } : {}),
        ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline) : null } : {}),
        ...(eventStarted !== undefined ? { eventStarted } : {}),
        ...(eventEnded !== undefined ? { eventEnded } : {}),
        ...(tracksEnabled !== undefined ? { tracksEnabled } : {})
      },
      create: {
        id: 'singleton',
        teamSize: teamSize && typeof teamSize === 'number' && teamSize >= 2 ? teamSize : 5,
        deadline: deadline ? new Date(deadline) : null,
        eventStarted: eventStarted || false,
        eventEnded: eventEnded || false,
        tracksEnabled: tracksEnabled || false
      }
    })
    
    if (deadline !== undefined) {
      broadcastEvent({
        type: 'deadline-updated',
        data: {
          deadline: updatedConfig.deadline,
          message: "The submission deadline has been updated"
        }
      })
    }
    
    return NextResponse.json(updatedConfig)
  } catch (error) {
    console.error('Error updating config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}