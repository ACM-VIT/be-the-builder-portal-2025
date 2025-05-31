import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from '@/app/api/auth/options'
import prisma from "@/lib/prisma"
import { broadcastEvent } from "@/lib/eventUtils"

export async function POST(req: NextRequest) {
  try {
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
    
    const { title, description, link } = await req.json()
    
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return NextResponse.json(
        { error: "Idea title must be at least 3 characters" },
        { status: 400 }
      )
    }
    
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return NextResponse.json(
        { error: "Idea description must be at least 10 characters" },
        { status: 400 }
      )
    }
    
    let validatedLink = null
    if (link) {
      try {
        const url = new URL(link)
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          return NextResponse.json(
            { error: "Link must be a valid HTTP/HTTPS URL" },
            { status: 400 }
          )
        }
        validatedLink = link
      } catch (e) {
        return NextResponse.json(
          { error: "Link must be a valid URL" },
          { status: 400 }
        )
      }
    }
    
    /*
    const config = await prisma.config.findFirst()
    
    if (config?.deadline && new Date() > config.deadline) {
      return NextResponse.json(
        { error: "The submission deadline has passed" },
        { status: 400 }
      )
    }
    */
    
    const updatedTeam = await prisma.team.update({
      where: { id: session.user.teamId },
      data: { 
        ...(({
          ideaTitle: title.trim(),
          ideaDescription: description.trim(),
          ideaLink: validatedLink,
          isSubmitted: true,
          submittedAt: new Date()
        }) as any)
      },
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
      type: 'idea-submitted',
      data: {
        team: updatedTeam,
        message: `Team "${updatedTeam.name}" has submitted their idea!`
      }
    })
    
    return NextResponse.json({
      success: true,
      team: updatedTeam
    })
  } catch (error) {
    console.error('Error submitting idea:', error)
    return NextResponse.json(
      { error: "Failed to submit idea" },
      { status: 500 }
    )
  }
}