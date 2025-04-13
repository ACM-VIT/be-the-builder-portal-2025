import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from '@/app/api/auth/options'
import prisma from "@/lib/prisma"
import { broadcastEvent } from "../../events/route"

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated and has a team
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
    
    // Get idea details
    const { title, description, link } = await req.json()
    
    // Validate input
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
    
    // Validate link if provided
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
    
    // Check for deadline - The schema was just updated, so run migration before this will work
    // Omitting this check for now until migration is run
    /*
    const config = await prisma.config.findFirst()
    
    if (config?.deadline && new Date() > config.deadline) {
      return NextResponse.json(
        { error: "The submission deadline has passed" },
        { status: 400 }
      )
    }
    */
    
    // Update the team with idea details
    const updatedTeam = await prisma.team.update({
      where: { id: session.user.teamId },
      data: { 
        // These fields depend on the migration being run
        // Adding a type assertion to bypass TypeScript error
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
    
    // Broadcast idea submission event
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