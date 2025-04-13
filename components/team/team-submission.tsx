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

  return (
    <div className="bg-white/10 rounded-xl p-5 mb-6">
      <h3 className="text-xl text-white font-bold mb-4">Project Idea</h3>
      
      {team.isSubmitted ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-emerald-500/30 text-white hover:bg-emerald-500/40 px-3 py-1">
              <CheckCircle className="h-3 w-3 mr-1" /> Submitted
            </Badge>
            {!isEditingIdea && (
              <Button 
                size="sm"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => setIsEditingIdea(true)}
              >
                <Edit className="h-4 w-4 mr-1" /> Edit Submission
              </Button>
            )}
          </div>
          
          {isEditingIdea ? (
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm mb-1">Project Title</label>
                <Input
                  value={ideaTitle}
                  onChange={(e) => setIdeaTitle(e.target.value)}
                  placeholder="Enter your project title"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm mb-1">Project Description</label>
                <Textarea
                  value={ideaDescription}
                  onChange={(e) => setIdeaDescription(e.target.value)}
                  placeholder="Describe your project idea in detail"
                  className="bg-white/10 border-white/20 text-white min-h-[100px]"
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm mb-1">Demo Link (Optional)</label>
                <Input
                  value={ideaLink}
                  onChange={(e) => setIdeaLink(e.target.value)}
                  placeholder="https://your-project-demo.com"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div className="flex space-x-2 justify-end">
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
                <Button 
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={submitIdea}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Update Submission
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-xl font-bold text-white mb-2">{team.ideaTitle || "No Title"}</h4>
              <p className="text-white/80 mb-4 whitespace-pre-line">
                {team.ideaDescription || "No description provided."}
              </p>
              {team.ideaLink && (
                <div className="flex items-center">
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
          )}
        </div>
      ) : (
        <div>
          <div className="bg-amber-500/20 rounded-lg p-3 border border-amber-500/30 mb-4">
            <div className="flex items-center text-white/90 font-medium">
              <AlertTriangle className="h-4 w-4 mr-2 text-amber-400" />
              No submission yet
            </div>
            <p className="text-white/70 text-sm mt-1">
              Create and submit your project idea before the deadline.
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm mb-1">Project Title</label>
              <Input
                value={ideaTitle}
                onChange={(e) => setIdeaTitle(e.target.value)}
                placeholder="Enter your project title"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm mb-1">Project Description</label>
              <Textarea
                value={ideaDescription}
                onChange={(e) => setIdeaDescription(e.target.value)}
                placeholder="Describe your project idea in detail"
                className="bg-white/10 border-white/20 text-white min-h-[100px]"
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm mb-1">Demo Link (Optional)</label>
              <Input
                value={ideaLink}
                onChange={(e) => setIdeaLink(e.target.value)}
                placeholder="https://your-project-demo.com"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="flex justify-end">
              <Button 
                className="bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white"
                onClick={submitIdea}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Idea
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 