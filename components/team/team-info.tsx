"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Trophy, Edit, Rocket, Clock } from "lucide-react"
import { useNotifications } from "@/lib/contexts/notification-context"

interface TeamInfoProps {
  team: any
  deadline: Date | null
  onTeamUpdate: () => void
}

export function TeamInfo({ team, deadline, onTeamUpdate }: TeamInfoProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [newTeamName, setNewTeamName] = useState(team?.name || "")
  const { notify } = useNotifications()

  const updateTeamName = async () => {
    if (!newTeamName.trim() || newTeamName.trim().length < 3) {
      notify("Error", "Team name must be at least 3 characters", "error")
      return
    }
    
    try {
      const response = await fetch('/api/teams/update-name', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName.trim() })
      })
      
      if (response.ok) {
        const data = await response.json()
        setIsEditingName(false)
        notify("Success", "Team name updated successfully", "success")
        onTeamUpdate()
      } else {
        const error = await response.json()
        notify("Error", error.error || "Failed to update team name", "error")
      }
    } catch (error) {
      console.error("Error updating team name:", error)
      notify("Error", "Failed to update team name", "error")
    }
  }

  return (
    <div className="bg-white/10 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl text-white font-bold">Team Information</h3>
        
        {isEditingName ? (
          <div className="flex items-center space-x-2">
            <Input
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Enter new team name"
              className="bg-white/10 border-white/20 text-white"
            />
            <Button 
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={updateTeamName}
            >
              Save
            </Button>
            <Button 
              size="sm"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => {
                setIsEditingName(false)
                setNewTeamName(team?.name || "")
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button 
            size="sm"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => setIsEditingName(true)}
          >
            <Edit className="h-4 w-4 mr-1" /> Rename Team
          </Button>
        )}
      </div>
      
      <div className="flex items-center mb-4">
        <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-indigo-600 rounded-full flex items-center justify-center text-white mr-4">
          <Trophy className="h-8 w-8" />
        </div>
        <div>
          <div className="flex items-center">
            <h3 className="text-2xl font-bold text-white mr-2">{team?.name || "Unnamed Team"}</h3>
            <Badge className="bg-white/20 text-white">
              {team?.users?.length || 0} members
            </Badge>
          </div>
          <p className="text-white/70 mt-1">ID: {team?.id}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
        <div className="bg-white/10 rounded-lg p-3">
          <h4 className="text-white font-medium text-sm mb-1 flex items-center">
            <Rocket className="h-4 w-4 mr-1 text-pink-400" /> Team Goal
          </h4>
          <p className="text-white/80 text-sm">Create an innovative solution that addresses real-world challenges</p>
        </div>
        
        {deadline ? (
          <div className="bg-white/10 rounded-lg p-3">
            <h4 className="text-white font-medium text-sm mb-1 flex items-center">
              <Clock className="h-4 w-4 mr-1 text-pink-400" /> Submission Deadline
            </h4>
            <p className="text-white/80 text-sm">{deadline.toLocaleString()}</p>
          </div>
        ) : (
          <div className="bg-white/10 rounded-lg p-3">
            <h4 className="text-white font-medium text-sm mb-1 flex items-center">
              <Clock className="h-4 w-4 mr-1 text-pink-400" /> Submission Deadline
            </h4>
            <p className="text-white/80 text-sm">Not yet announced</p>
          </div>
        )}
      </div>
    </div>
  )
} 