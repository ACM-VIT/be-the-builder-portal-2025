// components/Dashboard.tsx (Client Component)
"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { SplineScene } from "@/components/spline-scene"
import { 
  LogOut, 
  Settings, 
  Layers, 
  Sparkles, 
  Users, 
  Code, 
  Trophy, 
  Lightbulb, 
  HelpCircle, 
  ChevronDown, 
  CalendarClock,
  Edit,
  Clock,
  Link as LinkIcon,
  Send,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Rocket,
  BrainCircuit
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { signOut } from "next-auth/react"
import { useEvents, EventType, EventData } from "@/lib/hooks/use-events"
import { useNotifications } from "@/lib/contexts/notification-context"
import { Tooltip } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TeamInfo } from "@/components/team/team-info"
import { TeamSubmission } from "@/components/team/team-submission"
import { TeamMembers } from "@/components/team/team-members"

interface CustomUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  domain?: string | null
  teamId?: string | null
}

// Extended team interface with idea submission details
interface TeamWithIdea {
  id: string
  name: string
  users: {
    id: string
    name?: string | null
    email?: string | null
    domain?: string | null
  }[]
  ideaTitle?: string | null
  ideaDescription?: string | null
  ideaLink?: string | null
  isSubmitted?: boolean
  submittedAt?: string | null
}

interface DashboardProps {
  user: CustomUser
}

export function Dashboard({ user }: DashboardProps) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'home' | 'team'>('home')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [team, setTeam] = useState<TeamWithIdea | null>(null)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [isEditingName, setIsEditingName] = useState(false)
  const [newTeamName, setNewTeamName] = useState("")
  const [deadline, setDeadline] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ideaTitle, setIdeaTitle] = useState("")
  const [ideaDescription, setIdeaDescription] = useState("")
  const [ideaLink, setIdeaLink] = useState("")
  const [isEditingIdea, setIsEditingIdea] = useState(false)
  const [showTeamAssignedDialog, setShowTeamAssignedDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isTeamDataError, setIsTeamDataError] = useState(false)
  const [isConfigError, setIsConfigError] = useState(false)
  
  const { notify } = useNotifications()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    setMounted(true)
    
    // Fetch team data if the user has a team ID
    if (user.teamId) {
      fetchTeamData()
    } else {
      setIsLoading(false)
    }

    // Fetch config to get the deadline
    fetchConfig()
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [user.teamId])
  
  // Set up real-time event listeners
  const { on } = useEvents()
  
  useEffect(() => {
    // Handle team assignment event
    const teamAssignedCleanup = on('team-assigned', (event: EventData) => {
      if (event.data?.teams) {
        const userTeam = event.data.teams.find((t: any) => 
          Array.isArray(t.users) && t.users.some((u: any) => u.id === user.id)
        )
        
        if (userTeam && userTeam.id) {
          setTeam(userTeam)
          setTeamMembers(Array.isArray(userTeam.users) ? userTeam.users : [])
          setShowTeamAssignedDialog(true)
          notify("Team Assigned", "You have been assigned to a team!", "success")
        }
      }
    })
    
    // Handle team update event
    const teamUpdatedCleanup = on('team-updated', (event: EventData) => {
      if (event.data?.team && event.data.team.id === user.teamId) {
        setTeam(event.data.team)
        setTeamMembers(Array.isArray(event.data.team.users) ? event.data.team.users : [])
        notify("Team Updated", event.data.message || "Your team has been updated", "info")
      }
    })
    
    // Handle idea submission event
    const ideaSubmittedCleanup = on('idea-submitted', (event: EventData) => {
      if (event.data?.team && event.data.team.id === user.teamId) {
        setTeam(event.data.team)
        setIdeaTitle(event.data.team.ideaTitle || "")
        setIdeaDescription(event.data.team.ideaDescription || "")
        setIdeaLink(event.data.team.ideaLink || "")
        notify("Idea Submitted", "Your team's idea has been submitted!", "success")
      }
    })
    
    // Handle deadline updates
    const deadlineUpdatedCleanup = on('deadline-updated', (event: EventData) => {
      if (event.data?.deadline) {
        setDeadline(new Date(event.data.deadline))
        notify("Deadline Updated", event.data.message || "The submission deadline has been updated", "info")
      }
    })
    
    // Clean up event listeners
    return () => {
      teamAssignedCleanup()
      teamUpdatedCleanup()
      ideaSubmittedCleanup()
      deadlineUpdatedCleanup()
    }
  }, [on, user.id, user.teamId, notify])
  
  // Timer for countdown
  useEffect(() => {
    if (deadline) {
      const updateTimer = () => {
        const now = new Date()
        const diff = deadline.getTime() - now.getTime()
        
        if (diff <= 0) {
          setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 })
          if (timerRef.current) {
            clearInterval(timerRef.current)
          }
          return
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        
        setTimeRemaining({ days, hours, minutes, seconds })
      }
      
      updateTimer()
      timerRef.current = setInterval(updateTimer, 1000)
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
    }
  }, [deadline])
  
  // Function to fetch team data
  const fetchTeamData = async (retry = true) => {
    try {
      setIsTeamDataError(false)
      setIsLoading(true)
      
      // Check if user has a teamId - prevent unnecessary API calls
      if (!user.teamId) {
        setIsLoading(false)
        return;
      }
      
      const response = await fetch(`/api/teams/${user.teamId}`)
      
      if (response.ok) {
        const data = await response.json()
        setTeam(data)
        setTeamMembers(Array.isArray(data.users) ? data.users : [])
        setNewTeamName(data.name || "")
        setIdeaTitle(data.ideaTitle || "")
        setIdeaDescription(data.ideaDescription || "")
        setIdeaLink(data.ideaLink || "")
      } else {
        console.warn(`Error fetching team data: ${response.status} ${response.statusText}`)
        
        if (response.status === 404 && retry) {
          // If it's a 404, wait a bit and try once more (might be eventual consistency issue)
          setTimeout(() => fetchTeamData(false), 2000);
          return;
        }
        
        setIsTeamDataError(true)
        notify("Error", "Failed to load team data. Please try again.", "error")
      }
    } catch (error) {
      console.error("Error fetching team data:", error)
      setIsTeamDataError(true)
      notify("Error", "Failed to load team data. Please try again.", "error")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Function to fetch config (deadline)
  const fetchConfig = async (retry = true) => {
    try {
      setIsConfigError(false)
      const response = await fetch('/api/config')
      
      if (response.ok) {
        const data = await response.json()
        if (data.deadline) {
          setDeadline(new Date(data.deadline))
        }
      } else {
        console.warn(`Error fetching config: ${response.status} ${response.statusText}`)
        
        if (response.status === 404 && retry) {
          // If it's a 404, wait a bit and try once more
          setTimeout(() => fetchConfig(false), 2000);
          return;
        }
        
        setIsConfigError(true)
      }
    } catch (error) {
      console.error("Error fetching config:", error)
      setIsConfigError(true)
    }
  }
  
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }
  
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
        setTeam(data.team)
        setIsEditingName(false)
        notify("Success", "Team name updated successfully", "success")
      } else {
        const error = await response.json()
        notify("Error", error.error || "Failed to update team name", "error")
      }
    } catch (error) {
      console.error("Error updating team name:", error)
      notify("Error", "Failed to update team name", "error")
    }
  }

  const domainColors: Record<string, string> = {
    'cc': '#FF50A2',
    'web': '#FF8C42',
    'app': '#FFD166',
    'research': '#06D6A0',
    'management': '#118AB2'
  }

  const getDomainIcon = (domain: string | null | undefined) => {
    switch(domain) {
      case 'cc': return <Lightbulb className="w-5 h-5" />;
      case 'web': return <Layers className="w-5 h-5" />;
      case 'app': return <Code className="w-5 h-5" />;
      case 'research': return <Sparkles className="w-5 h-5" />;
      case 'management': return <Users className="w-5 h-5" />;
      default: return <HelpCircle className="w-5 h-5" />;
    }
  };

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
        setTeam(data.team)
        setIsEditingIdea(false)
        notify("Success", "Idea submitted successfully", "success")
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

  const renderHomeTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center"
    >
      <div className="text-center mb-6">
        <motion.h1 
          className="text-4xl font-bold text-white mb-2 tracking-tighter drop-shadow-md"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            delay: 0.1 
          }}
        >
          Be The Builder 2.0
        </motion.h1>
      </div>

      {!isConfigError && timeRemaining && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4 text-center w-full max-w-2xl"
        >
          <h2 className="text-lg font-bold text-white mb-2 flex items-center justify-center">
            <Clock className="mr-2 h-4 w-4" /> Submission Deadline
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "D", value: timeRemaining.days },
              { label: "H", value: timeRemaining.hours },
              { label: "M", value: timeRemaining.minutes },
              { label: "S", value: timeRemaining.seconds },
            ].map((item) => (
              <div key={item.label} className="bg-white/5 rounded-lg p-1">
                <div className="text-2xl font-bold text-white">{item.value}</div>
                <div className="text-white/70 text-xs">{item.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-white/15 backdrop-blur-md rounded-xl overflow-hidden border border-white/20 shadow-lg hover:shadow-xl transition-all"
        >
          <div className="bg-gradient-to-r from-pink-500 to-indigo-600 p-3 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Your Domain</h3>
            {getDomainIcon(user.domain)}
          </div>
          <div className="p-4">
            <div className="mb-3 flex items-center">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-white" 
                style={{ backgroundColor: user.domain ? domainColors[user.domain] : '#6366F1' }}
              >
                {getDomainIcon(user.domain)}
              </div>
              <div>
                <span className="text-white font-bold">
                  {user.domain || "Not Assigned"}
                </span>
                <p className="text-white/70 text-xs">Your expertise area</p>
              </div>
            </div>
            <div className="mb-4 min-h-[60px] bg-white/5 rounded-lg p-2 text-sm">
              <p className="text-white/80">
                {getDomainDescription(user.domain)}
              </p>
            </div>
            <Button 
              className="w-full bg-white hover:bg-white/90 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
              onClick={() => setActiveTab('team')}
            >
              <Users className="mr-2 h-3 w-3" />
              View Team
            </Button>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-white/15 backdrop-blur-md rounded-xl overflow-hidden border border-white/20 shadow-lg hover:shadow-xl transition-all"
        >
          <div className="bg-gradient-to-r from-pink-500 to-indigo-600 p-3 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Team Status</h3>
            <Users className="text-white" />
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[180px]">
                <Loader2 className="h-6 w-6 text-white/70 animate-spin mb-2" />
                <p className="text-white/80 text-sm">Loading team information...</p>
              </div>
            ) : isTeamDataError ? (
              <div className="flex flex-col items-center justify-center h-[180px]">
                <AlertTriangle className="h-6 w-6 text-amber-400 mb-2" />
                <p className="text-white/80 text-sm mb-2">Failed to load team data</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFetchTeamData}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  Try Again
                </Button>
              </div>
            ) : team ? (
              <>
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-indigo-600 rounded-full flex items-center justify-center mr-3">
                    <Trophy className="text-white h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-white font-bold">
                      {team.name}
                    </span>
                    <p className="text-white/70 text-xs">
                      {team.users?.length || 0} team members
                    </p>
                  </div>
                </div>
                
                <div className="mb-4 min-h-[60px]">
                  {team.isSubmitted ? (
                    <div className="bg-emerald-500/20 rounded-lg p-2 border border-emerald-500/30">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white/90 text-sm font-medium flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1 text-emerald-400" />
                          Idea Submitted
                        </p>
                        <Badge className="bg-emerald-500/30 text-white hover:bg-emerald-500/40 text-xs">
                          {new Date(team.submittedAt || "").toLocaleDateString()}
                        </Badge>
                      </div>
                      <p className="text-white/90 text-sm font-medium line-clamp-1">
                        {team.ideaTitle || "No Title"}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-amber-500/20 rounded-lg p-2 border border-amber-500/30">
                      <div className="flex items-center mb-1">
                        <AlertTriangle className="h-3 w-3 mr-1 text-amber-400" />
                        <p className="text-white/90 text-sm font-medium">Not Submitted</p>
                      </div>
                      <p className="text-white/70 text-xs">
                        Submit your team's innovative solution
                      </p>
                    </div>
                  )}
                </div>
                
                <Button 
                  className="w-full bg-white hover:bg-white/90 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                  onClick={() => setActiveTab('team')}
                >
                  <Edit className="mr-2 h-3 w-3" />
                  {team.isSubmitted ? "View Submission" : "Create Submission"}
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-indigo-600 rounded-full flex items-center justify-center mr-3">
                    <CalendarClock className="text-white h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-white font-bold">
                      Waiting Assignment
                    </span>
                    <p className="text-white/70 text-xs">
                      Not in a team yet
                    </p>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 mb-4 min-h-[60px]">
                  <div className="flex items-start">
                    <BrainCircuit className="h-4 w-4 text-pink-400 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-white/80 text-sm">
                      Teams will be assigned soon to ensure balanced domain expertise.
                    </p>
                  </div>
                </div>
                <Button 
                  className="w-full bg-white/50 hover:bg-white/60 text-indigo-900 font-medium text-sm"
                  onClick={() => setActiveTab('team')}
                  disabled
                >
                  <Users className="mr-2 h-3 w-3" />
                  View Team
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  const renderTeamTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl w-full mx-auto bg-white/20 backdrop-blur-md rounded-xl overflow-hidden border border-white/20 shadow-lg"
    >
      <div className="bg-gradient-to-r from-pink-500 to-indigo-600 p-5">
        <h2 className="text-2xl font-bold text-white">Your Team</h2>
        <p className="text-white/70 mt-1">Collaboration details and team members</p>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20">
          <Loader2 className="h-12 w-12 text-white/70 animate-spin mb-4" />
          <p className="text-white/80 text-lg">Loading team information...</p>
        </div>
      ) : isTeamDataError ? (
        <div className="flex flex-col items-center justify-center p-20">
          <AlertTriangle className="h-12 w-12 text-amber-400 mb-4" />
          <p className="text-white/80 text-lg mb-2">Failed to load team data</p>
          <Button
            variant="outline"
            onClick={handleFetchTeamData}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            Try Again
          </Button>
        </div>
      ) : user.teamId && team ? (
        <div className="p-6">
          <TeamInfo 
            team={team} 
            deadline={deadline} 
            onTeamUpdate={handleFetchTeamData} 
          />
          
          <TeamSubmission 
            team={team} 
            onSubmissionUpdate={handleFetchTeamData} 
          />
          
          <h3 className="text-xl text-white font-bold mb-4">Team Members</h3>
          
          <TeamMembers 
            isLoading={isLoading}
            isError={isTeamDataError}
            teamMembers={teamMembers}
            currentUserId={user.id}
            onRetry={handleFetchTeamData}
            domainColors={domainColors}
            getDomainIcon={getDomainIcon}
          />
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-r from-pink-500/20 to-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="text-white" size={36} />
          </div>
          <h3 className="text-2xl text-white font-bold mb-3">You're not in a team yet</h3>
          <p className="text-white/80 max-w-md mx-auto mb-6">
            Please wait for the admin to assign you to a team. Teams are being formed to ensure a balanced mix of domain expertise.
          </p>
          <Button 
            className="bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white"
            onClick={() => setActiveTab('home')}
          >
            Return Home
          </Button>
        </div>
      )}
    </motion.div>
  );

  function getDomainDescription(domain: string | null | undefined): string {
    switch(domain) {
      case 'cc':
        return "Your role involves creative direction and content creation for the project.";
      case 'web':
        return "Your expertise is in web development, creating responsive and interactive interfaces.";
      case 'app':
        return "You specialize in mobile application development and native experiences.";
      case 'research':
        return "Your focus is on gathering insights and data to inform the team's decisions.";
      case 'management':
        return "You help coordinate team efforts and ensure the project stays on track.";
      default:
        return "Your domain expertise will be assigned soon.";
    }
  }

  // Helper function to calculate deadline progress percentage
  const calculateDeadlineProgress = () => {
    if (!deadline) return 0;
    
    const now = new Date();
    const start = new Date(deadline);
    start.setDate(start.getDate() - 14); // Assuming 2-week event period
    
    const total = deadline.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    if (elapsed <= 0) return 0;
    if (elapsed >= total) return 100;
    
    return (elapsed / total) * 100;
  }

  // Add wrapper functions for event handlers
  const handleFetchConfig = () => {
    fetchConfig();
  };
  
  const handleFetchTeamData = () => {
    fetchTeamData();
  };

  //or we can use this one too
  //https://prod.spline.design/Bt-GQIu5bt160khd/scene.splinecode
  return (
    <div className="min-h-screen w-full overflow-hidden relative bg-gradient-to-br from-indigo-600 to-purple-700">
      {/* Background Spline scene with reduced opacity */}
      <div className="absolute inset-0 z-0">
        {mounted && (
          <SplineScene
            scene="https://prod.spline.design/Uuh3u5oK6J1E307V/scene.splinecode"
            className="w-full h-full"
          />
        )}
      </div>
      
      {/* Background overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-indigo-900/30 to-purple-900/50 backdrop-blur-sm" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 p-4 flex justify-between items-center"
      >
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full pl-4 pr-5 py-2 border border-white/20">
          <Avatar className="h-10 w-10 border-2 border-white/30">
            <AvatarImage src={user.image || ""} alt={user.name || "User"} />
            <AvatarFallback className="bg-indigo-600 text-white font-bold">
              {user.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-white font-bold">{user.name}</h2>
            <div className="flex items-center">
              {user.domain ? (
                <span 
                  className="px-2 py-0.5 rounded-full text-white text-xs inline-flex items-center" 
                  style={{ backgroundColor: domainColors[user.domain] || '#6366F1' }}
                >
                  {getDomainIcon(user.domain)} 
                  <span className="ml-1">{user.domain}</span>
                </span>
              ) : (
                <span className="text-white/70 text-xs">No domain assigned</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-3 rounded-full flex items-center transition-colors border border-white/20"
            >
              <Settings className="h-5 w-5" />
              <ChevronDown className="h-4 w-4 ml-1" />
            </button>
          </div>
          
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 mt-2 w-48 rounded-xl bg-white/20 backdrop-blur-lg shadow-lg border border-white/20 overflow-hidden z-50"
            >
              <div className="py-1">
                <button className="w-full text-left px-4 py-3 text-white hover:bg-white/20 flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </button>
                <button 
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-3 text-white hover:bg-white/20 flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* Tab Navigation */}
      <div className="relative z-10 flex justify-center mt-2 mb-8">
        <div className="bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/20 inline-flex">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-6 py-2 rounded-full text-white font-medium transition-colors ${
              activeTab === 'home' ? 'bg-indigo-600 shadow-md' : 'hover:bg-white/10'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-6 py-2 rounded-full text-white font-medium transition-colors ${
              activeTab === 'team' ? 'bg-indigo-600 shadow-md' : 'hover:bg-white/10'
            }`}
          >
            Team
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 px-4 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && renderHomeTab()}
          {activeTab === 'team' && renderTeamTab()}
        </AnimatePresence>
      </main>
    </div>
  )
}
