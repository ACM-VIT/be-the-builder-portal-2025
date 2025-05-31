'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/options'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const teamIdeaSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  link: z.string().url().nullable().optional(),
})

export async function submitTeamIdea(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return { error: 'You must be logged in to submit an idea' }
    }

    if (!session.user.teamId) {
      return { error: 'You must be part of a team to submit an idea' }
    }

    const title = formData.get('title')?.toString() || ''
    const description = formData.get('description')?.toString() || ''
    const link = formData.get('link')?.toString() || null

    const validationResult = teamIdeaSchema.safeParse({
      title,
      description,
      link: link || null,
    })

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || 'Invalid input'
      return { error: errorMessage }
    }

    try {
      await prisma.team.update({
        where: {
          id: session.user.teamId,
        },
        data: {
          ideaTitle: title.trim(),
          ideaDescription: description.trim(),
          ideaLink: link?.trim() || null,
          isSubmitted: true,
          updatedAt: new Date(),
        },
      })

      revalidatePath('/team')
      revalidatePath('/dashboard')
      revalidatePath('/')
      
      return { success: true }
    } catch (dbError) {
      console.error('Database error:', dbError)
      return { error: 'Failed to save your submission. Please try again.' }
    }
  } catch (error) {
    console.error('Server action error:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
} 