"use client"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { useOptimistic } from "@/lib/hooks/use-optimistic"
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
import { submitTeamIdea } from "@/app/actions/team"
import { useRouter } from "next/navigation"
import { useRef } from "react"

interface TeamSubmissionProps {
  team: {
    id: string
    ideaTitle?: string | null
    ideaDescription?: string | null
    ideaLink?: string | null
    isSubmitted?: boolean
  }
}

type TeamData = TeamSubmissionProps['team']

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button 
      type="submit"
      className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto min-w-[140px]"
      disabled={pending}
      aria-disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Submitting...
        </>
      ) : (
        <>
          <Send className="mr-2 h-4 w-4" />
          Submit Project
        </>
      )}
    </Button>
  )
}

// Client component that handles all the interactivity
export function TeamSubmission({ team }: TeamSubmissionProps) {
  const [isEditingIdea, setIsEditingIdea] = useState(false)
  const { notify } = useNotifications()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  // Optimistic update state
  const [optimisticTeam, updateOptimisticTeam] = useOptimistic({
    initialData: team,
    updateFn: (currentState: TeamData, newData: Partial<TeamData>) => ({
      ...currentState,
      ...newData,
    })
  })

  const initialState = { message: '', error: '' }

  const [state, formAction] = useFormState(async (prevState: any, formData: FormData) => {
    // Update optimistically
    const title = formData.get('title')?.toString()
    const description = formData.get('description')?.toString()
    const link = formData.get('link')?.toString()

    updateOptimisticTeam({
      ideaTitle: title || null,
      ideaDescription: description || null,
      ideaLink: link || null,
      isSubmitted: true,
    })

    const result = await submitTeamIdea(formData)
    
    if (result.success) {
      setIsEditingIdea(false)
      notify("Success", "Idea submitted successfully", "success")
      router.refresh()
      return { message: 'Success', error: '' }
    } else {
      // Revert optimistic update on error by refreshing
      router.refresh()
      notify("Error", result.error || "Failed to submit idea", "error")
      return { message: '', error: result.error || "Failed to submit idea" }
    }
  }, initialState)

  const SubmissionForm = () => (
    <form action={formAction} ref={formRef} className="space-y-6">
      {state?.error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center text-red-400">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span>{state.error}</span>
          </div>
        </div>
      )}
      <div>
        <label htmlFor="title" className="block text-white/80 text-sm font-medium mb-2">Project Title</label>
        <Input
          id="title"
          name="title"
          defaultValue={optimisticTeam?.ideaTitle || ""}
          placeholder="Enter your project title"
          className="bg-white/10 border-white/20 text-white w-full"
          required
          minLength={3}
          aria-describedby="title-error"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-white/80 text-sm font-medium mb-2">Project Description</label>
        <Textarea
          id="description"
          name="description"
          defaultValue={optimisticTeam?.ideaDescription || ""}
          placeholder="Describe your project idea in detail"
          className="bg-white/10 border-white/20 text-white min-h-[150px] lg:min-h-[200px] w-full resize-y"
          required
          minLength={10}
          aria-describedby="description-error"
        />
      </div>
      <div>
        <label htmlFor="link" className="block text-white/80 text-sm font-medium mb-2">Demo Link (Optional)</label>
        <Input
          id="link"
          name="link"
          defaultValue={optimisticTeam?.ideaLink || ""}
          placeholder="https://your-project-demo.com"
          className="bg-white/10 border-white/20 text-white w-full"
          type="url"
          aria-describedby="link-error"
        />
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
        {isEditingIdea && (
          <Button 
            type="button"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto"
            onClick={() => {
              setIsEditingIdea(false)
              formRef.current?.reset()
            }}
          >
            Cancel
          </Button>
        )}
        <SubmitButton />
      </div>
    </form>
  )

  return (
    <div className="bg-white/10 rounded-xl p-4 sm:p-6 lg:p-8 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6">
        <h3 className="text-xl lg:text-2xl text-white font-bold">Project Idea</h3>
        {optimisticTeam.isSubmitted && !isEditingIdea && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Badge className="bg-emerald-500/30 text-white hover:bg-emerald-500/40 px-3 py-1 w-fit">
              <CheckCircle className="h-3 w-3 mr-1.5" /> Submitted
            </Badge>
            <Button 
              size="sm"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto"
              onClick={() => setIsEditingIdea(true)}
            >
              <Edit className="h-4 w-4 mr-1.5" /> Edit Submission
            </Button>
          </div>
        )}
      </div>
      
      {optimisticTeam.isSubmitted ? (
        isEditingIdea ? (
          <SubmissionForm />
        ) : (
          <div className="bg-white/5 rounded-lg p-4 sm:p-5 lg:p-6 space-y-4">
            <h4 className="text-xl lg:text-2xl font-bold text-white">{optimisticTeam.ideaTitle || "No Title"}</h4>
            <p className="text-white/80 whitespace-pre-line leading-relaxed">
              {optimisticTeam.ideaDescription || "No description provided."}
            </p>
            {optimisticTeam.ideaLink && (
              <div className="flex items-center pt-2">
                <LinkIcon className="h-4 w-4 text-pink-400 mr-2 flex-shrink-0" />
                <a 
                  href={optimisticTeam.ideaLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:text-pink-300 underline text-sm break-all"
                >
                  {optimisticTeam.ideaLink}
                </a>
              </div>
            )}
          </div>
        )
      ) : (
        <div className="space-y-6">
          <div className="bg-amber-500/20 rounded-lg p-4 border border-amber-500/30">
            <div className="flex items-center text-white/90 font-medium">
              <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0 text-amber-400" />
              <span>No submission yet</span>
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