"use server"
import prisma from "@/lib/prisma"

export async function assignTeamAction(formData: FormData) {
  const userId = formData.get("userId") as string
  const teamId = formData.get("teamId") as string

  await prisma.user.update({
    where: { id: userId },
    data: { teamId },
  })
}
