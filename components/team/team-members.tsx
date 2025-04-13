"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Loader2 } from "lucide-react"

interface TeamMember {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  domain?: string | null
}

interface TeamMembersProps {
  isLoading: boolean
  isError: boolean
  teamMembers: TeamMember[]
  currentUserId: string
  onRetry: () => void
  domainColors: Record<string, string>
  getDomainIcon: (domain: string | null | undefined) => JSX.Element
}

export function TeamMembers({ 
  isLoading, 
  isError, 
  teamMembers, 
  currentUserId,
  onRetry,
  domainColors,
  getDomainIcon
}: TeamMembersProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[180px]">
        <Loader2 className="h-6 w-6 text-white/70 animate-spin mb-2" />
        <p className="text-white/80 text-sm">Loading team members...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[180px]">
        <Users className="h-12 w-12 text-white/40 mb-3" />
        <p className="text-white font-medium">Failed to load team members</p>
        <p className="text-white/60 text-sm mt-1 max-w-md">
          There was an error loading the team data. Please try again.
        </p>
        <Button 
          className="mt-4 bg-white/10 hover:bg-white/20 text-white"
          onClick={onRetry}
        >
          <Loader2 className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  if (!teamMembers || teamMembers.length === 0) {
    return (
      <div className="bg-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center">
        <Users className="h-12 w-12 text-white/40 mb-3" />
        <p className="text-white font-medium">No team members found</p>
        <p className="text-white/60 text-sm mt-1 max-w-md">
          This could be because team formation is still in progress. Check back later or contact an administrator.
        </p>
        <Button 
          className="mt-4 bg-white/10 hover:bg-white/20 text-white"
          onClick={onRetry}
        >
          <Loader2 className="mr-2 h-4 w-4" />
          Refresh Team Data
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {teamMembers.map((member) => (
        <div 
          key={member.id} 
          className={`bg-white/10 rounded-xl p-4 flex items-center ${
            member.id === currentUserId ? 'ring-2 ring-pink-500/50' : ''
          }`}
        >
          <Avatar className="w-12 h-12 mr-4">
            <AvatarImage src={member.image || ""} alt={member.name || "User"} />
            <AvatarFallback className="bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-bold">
              {member.name?.charAt(0) || member.email?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-medium">{member.name || member.email || "Unknown User"}</p>
            <div className="flex items-center mt-1">
              <span 
                className="px-2 py-0.5 rounded-full text-white text-xs flex items-center"
                style={{ backgroundColor: member.domain ? domainColors[member.domain] : '#6366F1' }}
              >
                {getDomainIcon(member.domain)}
                <span className="ml-1">{member.domain || "Unknown"}</span>
              </span>
              {member.id === currentUserId && (
                <span className="ml-2 text-white/60 text-xs">You</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 