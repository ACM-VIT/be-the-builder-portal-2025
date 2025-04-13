"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  AlertTriangle, 
  Edit, 
  Send, 
  Loader2, 
  Link as LinkIcon 
} from "lucide-react"
import { useNotifications } from "@/lib/contexts/notification-context"

interface TeamSubmissionProps {
  team: any
  onSubmissionUpdate: () => void
}

export function TeamSubmission({ team, onSubmissionUpdate }: TeamSubmissionProps) {
  const [isEditingIdea, setIsEditingIdea] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ideaTitle, setIdeaTitle] = useState(team?.ideaTitle || "")
  const [ideaDescription, setIdeaDescription] = useState(team?.ideaDescription || "")
  const [ideaLink, setIdeaLink] = useState(team?.ideaLink || "")
  
  const { notify } = useNotifications()

  const submitIdea = async () => {
    if (!ideaTitle.trim() || ideaTitle.trim().length < 3) {
      notify("Error", "Idea title must be at least 3 characters", "error")
      return
    }
    
    if (!ideaDescription.trim() || ideaDescription.trim().length < 10) {
      notify("Error", "Idea description must be at least 10 characters", "error")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/teams/submit-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ideaTitle.trim(),
          description: ideaDescription.trim(),
          link: ideaLink.trim() || null
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setIsEditingIdea(false)
        notify("Success", "Idea submitted successfully", "success")
        onSubmissionUpdate()
      } else {
        const error = await response.json()
        notify("Error", error.error || "Failed to submit idea", "error")
      }
    } catch (error) {
      console.error("Error submitting idea:", error)
      notify("Error", "Failed to submit idea", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const SubmissionForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">Project Title</label>
        <Input
          value={ideaTitle}
          onChange={(e) => setIdeaTitle(e.target.value)}
          placeholder="Enter your project title"
          className="bg-white/10 border-white/20 text-white w-full"
        />
      </div>
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">Project Description</label>
        <Textarea
          value={ideaDescription}
          onChange={(e) => setIdeaDescription(e.target.value)}
          placeholder="Describe your project idea in detail"
          className="bg-white/10 border-white/20 text-white min-h-[150px] w-full"
        />
      </div>
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">Demo Link (Optional)</label>
        <Input
          value={ideaLink}
          onChange={(e) => setIdeaLink(e.target.value)}
          placeholder="https://your-project-demo.com"
          className="bg-white/10 border-white/20 text-white w-full"
        />
      </div>
      <div className="flex space-x-3 justify-end pt-2">
        {isEditingIdea && (
          <Button 
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => {
              setIsEditingIdea(false)
              setIdeaTitle(team.ideaTitle || "")
              setIdeaDescription(team.ideaDescription || "")
              setIdeaLink(team.ideaLink || "")
            }}
          >
            Cancel
          </Button>
        )}
        <Button 
          className="bg-emerald-500 hover:bg-emerald-600 text-white min-w-[140px]"
          onClick={submitIdea}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditingIdea ? 'Updating...' : 'Submitting...'}
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              {isEditingIdea ? 'Update Submission' : 'Submit Project'}
            </>
          )}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="bg-white/10 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl text-white font-bold">Project Idea</h3>
        {team.isSubmitted && !isEditingIdea && (
          <div className="flex items-center space-x-3">
            <Badge className="bg-emerald-500/30 text-white hover:bg-emerald-500/40 px-3 py-1">
              <CheckCircle className="h-3 w-3 mr-1.5" /> Submitted
            </Badge>
            <Button 
              size="sm"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => setIsEditingIdea(true)}
            >
              <Edit className="h-4 w-4 mr-1.5" /> Edit Submission
            </Button>
          </div>
        )}
      </div>
      
      {team.isSubmitted ? (
        isEditingIdea ? (
          <SubmissionForm />
        ) : (
          <div className="bg-white/5 rounded-lg p-5 space-y-4">
            <h4 className="text-xl font-bold text-white">{team.ideaTitle || "No Title"}</h4>
            <p className="text-white/80 whitespace-pre-line leading-relaxed">
              {team.ideaDescription || "No description provided."}
            </p>
            {team.ideaLink && (
              <div className="flex items-center pt-2">
                <LinkIcon className="h-4 w-4 text-pink-400 mr-2" />
                <a 
                  href={team.ideaLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:text-pink-300 underline text-sm"
                >
                  View Demo
                </a>
              </div>
            )}
          </div>
        )
      ) : (
        <div className="space-y-6">
          <div className="bg-amber-500/20 rounded-lg p-4 border border-amber-500/30">
            <div className="flex items-center text-white/90 font-medium">
              <AlertTriangle className="h-4 w-4 mr-2 text-amber-400" />
              No submission yet
            </div>
            <p className="text-white/70 text-sm mt-1.5">
              Create and submit your project idea before the deadline.
            </p>
          </div>
          <SubmissionForm />
        </div>
      )}
    </div>
  )
} 