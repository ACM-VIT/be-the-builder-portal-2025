// components/AdminView.tsx
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import type { Prisma } from "@prisma/client"
import { 
  Users, 
  UserPlus, 
  Award, 
  PieChart, 
  Layers, 
  CheckCircle2, 
  BarChart4, 
  UserCheck, 
  RefreshCcw,
  Megaphone,
  Tag,
  Settings as SettingsIcon,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit
} from "lucide-react"

// Define minimal types using Prisma helper types.
type MinimalUser = Prisma.UserGetPayload<{
  select: { id: true; name: true; email: true; domain: true; teamId: true }
}>
type MinimalTeam = Prisma.TeamGetPayload<{
  select: { id: true; name: true }
}>

type TeamWithUsers = MinimalTeam & {
  users: MinimalUser[]
  domainCounts?: Record<string, number>
  totalMembers: number
  track?: {
    id: string
    name: string
    color?: string | null
  } | null
}

type Track = {
  id: string
  name: string
  description?: string | null
  color?: string | null
  _count?: {
    teams: number
  }
}

type ConfigType = {
  id: string
  teamSize: number
  deadline: string | null
  eventStarted: boolean
  eventEnded: boolean
  tracksEnabled: boolean
}

export default function AdminView() {
  const [users, setUsers] = useState<MinimalUser[]>([])
  const [teams, setTeams] = useState<TeamWithUsers[]>([])
  const [tracks, setTracks] = useState<Track[]>([])
  const [domains, setDomains] = useState<string[]>([])
  const [teamSize, setTeamSize] = useState(5)
  const [config, setConfig] = useState<ConfigType>({
    id: "singleton",
    teamSize: 5,
    deadline: null,
    eventStarted: false,
    eventEnded: false,
    tracksEnabled: false
  })
  const [loading, setLoading] = useState(true)
  const [newTeamName, setNewTeamName] = useState("")
  const [newTrackName, setNewTrackName] = useState("")
  const [newTrackColor, setNewTrackColor] = useState("#6366F1")
  const [newTrackDescription, setNewTrackDescription] = useState("")
  const [editingTrack, setEditingTrack] = useState<Track | null>(null)
  const [balancingInProgress, setBalancingInProgress] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'teams' | 'stats' | 'assign' | 'tracks' | 'settings'>('stats')
  const [isSaving, setIsSaving] = useState(false)

  // Domain color map for consistent coloring
  const domainColors: Record<string, string> = {
    'cc': '#FF50A2',
    'web': '#FF8C42',
    'app': '#FFD166',
    'research': '#06D6A0',
    'management': '#118AB2'
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, teamsResponse, domainsResponse, configResponse, tracksResponse] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/teams-with-users'),
          fetch('/api/admin/domains'),
          fetch('/api/admin/config'),
          fetch('/api/admin/tracks')
        ])
        
        if (!usersResponse.ok || !teamsResponse.ok || !domainsResponse.ok) {
          throw new Error('Failed to fetch data')
        }
        
        const usersData = await usersResponse.json()
        const teamsData = await teamsResponse.json()
        const domainsData = await domainsResponse.json()
        
        setUsers(usersData)
        setTeams(teamsData)
        setDomains(Array.isArray(domainsData) ? domainsData : [])
        
        if (configResponse.ok) {
          const configData = await configResponse.json()
          setConfig(configData)
          setTeamSize(configData.teamSize || 5)
        }
        
        if (tracksResponse.ok) {
          const tracksData = await tracksResponse.json()
          setTracks(Array.isArray(tracksData) ? tracksData : [])
        }
      } catch (error) {
        console.error('Error fetching admin data:', error)
        // Initialize with empty arrays on error
        setDomains([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newTeamName.trim()) return
    
    try {
      const response = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create team')
      }
      
      const newTeam = await response.json()
      setTeams([...teams, {...newTeam, users: [], totalMembers: 0}])
      setNewTeamName("")
    } catch (error) {
      console.error('Error creating team:', error)
    }
  }
  
  const handleAutoAssignTeams = async () => {
    try {
      setBalancingInProgress(true)
      const response = await fetch('/api/admin/auto-assign-teams', {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to auto-assign teams')
      }
      
      // Refresh data after assignment
      const [usersResponse, teamsResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/teams-with-users')
      ])
      
      const usersData = await usersResponse.json()
      const teamsData = await teamsResponse.json()
      
      setUsers(usersData)
      setTeams(teamsData)
    } catch (error) {
      console.error('Error auto-assigning teams:', error)
    } finally {
      setBalancingInProgress(false)
    }
  }
  
  const handleUpdateTeamSize = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamSize })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update team size')
      }
    } catch (error) {
      console.error('Error updating team size:', error)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-indigo-600 to-purple-500 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-r-4 border-white rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white">Loading admin dashboard...</h2>
          <p className="text-white">Please wait while we gather the data</p>
        </div>
      </div>
    )
  }

  // Count users by domain
  const usersByDomain: Record<string, number> = {}
  users.forEach(user => {
    if (user.domain) {
      usersByDomain[user.domain] = (usersByDomain[user.domain] || 0) + 1
    }
  })

  // Count users without teams
  const usersWithoutTeam = users.filter(user => !user.teamId)

  const renderStatsTab = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-indigo-100 flex flex-col">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mr-4">
              <Users className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Total Users</h3>
              <p className="text-gray-500">All participants</p>
            </div>
          </div>
          <p className="text-4xl font-bold text-indigo-600">{users.length}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-indigo-100 flex flex-col">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mr-4">
              <Layers className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Teams</h3>
              <p className="text-gray-500">Created groups</p>
            </div>
          </div>
          <p className="text-4xl font-bold text-indigo-600">{teams.length}</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border border-indigo-100 flex flex-col">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mr-4">
              <PieChart className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Domains</h3>
              <p className="text-gray-500">Skill categories</p>
            </div>
          </div>
          <p className="text-4xl font-bold text-indigo-600">{domains.length}</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border border-indigo-100 flex flex-col">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mr-4">
              <UserPlus className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Unassigned</h3>
              <p className="text-gray-500">Users without teams</p>
            </div>
          </div>
          <p className="text-4xl font-bold text-indigo-600">{usersWithoutTeam.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-indigo-100">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
              <BarChart4 className="text-white" size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Domain Distribution</h2>
          </div>
          <div className="space-y-4">
            {Array.isArray(domains) && domains.length > 0 ? (
              domains.map(domain => (
                <div key={domain} className="relative">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700 font-semibold">{domain}</span>
                    <span className="text-gray-700 font-semibold">{usersByDomain[domain] || 0} users</span>
                  </div>
                  <div className="w-full h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{
                        width: `${Math.min(100, ((usersByDomain[domain] || 0) / users.length) * 100)}%`,
                        backgroundColor: domainColors[domain] || '#4F46E5'
                      }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No domains available</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-indigo-100">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
              <Award className="text-white" size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Team Management</h2>
          </div>
          
          <form onSubmit={handleUpdateTeamSize} className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Team Size</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                value={teamSize} 
                onChange={e => setTeamSize(parseInt(e.target.value) || 5)} 
                min="2"
                className="w-full p-3 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button type="submit" className="p-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-lg font-medium">
                Update
              </button>
            </div>
          </form>
          
          <form onSubmit={handleCreateTeam} className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Create Team</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newTeamName} 
                onChange={e => setNewTeamName(e.target.value)} 
                placeholder="Team name" 
                className="w-full p-3 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button type="submit" className="p-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-lg font-medium">
                Create
              </button>
            </div>
          </form>
          
          <button 
            onClick={handleAutoAssignTeams} 
            disabled={balancingInProgress}
            className={`w-full p-4 rounded-lg mt-4 flex items-center justify-center font-bold text-lg shadow-lg transition-all ${
              balancingInProgress ? 
              'bg-indigo-300 text-white cursor-not-allowed' : 
              'bg-indigo-500 text-white hover:bg-indigo-600 hover:scale-[1.02]'
            }`}
          >
            {balancingInProgress ? (
              <>
                <RefreshCcw className="animate-spin mr-2" size={20} />
                Assigning Teams...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2" size={20} />
                Auto-Assign Teams (Balance Domains)
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )

  const renderUsersTab = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-indigo-100"
    >
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
          <Users className="text-white" size={20} />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Participants</h2>
      </div>
      
      <div className="overflow-auto rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="bg-indigo-500 text-white">
              <th className="p-3 text-left font-semibold rounded-tl-lg">Name</th>
              <th className="p-3 text-left font-semibold">Email</th>
              <th className="p-3 text-left font-semibold">Domain</th>
              <th className="p-3 text-left font-semibold rounded-tr-lg">Team</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => {
              const userTeam = teams.find(t => t.id === user.teamId)
              return (
                <tr key={user.id} className="bg-white hover:bg-gray-50 transition-colors">
                  <td className="p-3 text-gray-800 font-medium">{user.name || "-"}</td>
                  <td className="p-3 text-gray-800">{user.email}</td>
                  <td className="p-3">
                    {user.domain ? (
                      <span 
                        className="px-3 py-1 rounded-full text-white text-sm font-medium"
                        style={{ backgroundColor: domainColors[user.domain] || '#4F46E5' }}
                      >
                        {user.domain}
                      </span>
                    ) : "-"}
                  </td>
                  <td className="p-3">
                    {userTeam ? (
                      <span className="px-3 py-1 bg-green-500 text-white text-sm rounded-full">
                        {userTeam.name}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-400 text-white text-sm rounded-full">
                        Unassigned
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
  
  const renderTeamsTab = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(team => (
          <div key={team.id} className="bg-white rounded-xl overflow-hidden shadow-lg border border-indigo-100">
            <div className="bg-indigo-500 p-4">
              <h3 className="text-xl font-bold text-white">{team.name}</h3>
              <div className="flex justify-between items-center mt-1">
                <span className="text-indigo-100 text-sm">
                  {team.totalMembers} / {teamSize} Members
                </span>
                <div className="w-24 h-3 bg-white bg-opacity-30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full"
                    style={{ width: `${(team.totalMembers / teamSize) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <h4 className="text-gray-800 font-semibold mb-2 flex items-center">
                <PieChart size={16} className="mr-2 text-indigo-500" /> Domain Distribution
              </h4>
              {team.domainCounts && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {Object.entries(team.domainCounts).map(([domain, count]) => (
                    <div 
                      key={domain} 
                      className="p-2 rounded-lg flex items-center justify-between"
                      style={{ backgroundColor: `${domainColors[domain] || '#4F46E5'}25` }}
                    >
                      <span className="text-gray-800 font-medium">{domain}</span>
                      <span className="text-white bg-indigo-500 rounded-full w-6 h-6 flex items-center justify-center text-xs">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              <h4 className="text-gray-800 font-semibold mb-2 flex items-center">
                <Users size={16} className="mr-2 text-indigo-500" /> Team Members
              </h4>
              <div className="max-h-[150px] overflow-y-auto pr-2 grid gap-1">
                {team.users.length > 0 ? team.users.map(user => (
                  <div key={user.id} className="bg-gray-50 p-2 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center mr-2 text-white text-xs font-bold">
                        {(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                      </div>
                      <span className="text-gray-800 text-sm truncate max-w-[120px]" title={user.name || user.email || ''}>
                        {user.name || user.email || 'Unknown'}
                      </span>
                    </div>
                    {user.domain && (
                      <span 
                        className="px-2 py-0.5 rounded-full text-white text-xs"
                        style={{ backgroundColor: domainColors[user.domain] || '#4F46E5' }}
                      >
                        {user.domain}
                      </span>
                    )}
                  </div>
                )) : (
                  <div className="text-gray-500 text-center py-2">No members yet</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
  
  const renderAssignTab = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto bg-white rounded-xl p-6 shadow-lg border border-indigo-100"
    >
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
          <UserCheck className="text-white" size={20} />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Assign Team</h2>
      </div>
      
      <form onSubmit={async (e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        try {
          const response = await fetch('/api/admin/assign-team', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: formData.get('userId'),
              teamId: formData.get('teamId')
            }),
          })
          
          if (!response.ok) {
            throw new Error('Failed to assign team')
          }
          
          // Refresh the data
          const [updatedUsersResponse, updatedTeamsResponse] = await Promise.all([
            fetch('/api/admin/users'),
            fetch('/api/admin/teams-with-users')
          ])
          
          const updatedUsers = await updatedUsersResponse.json()
          const updatedTeams = await updatedTeamsResponse.json()
          
          setUsers(updatedUsers)
          setTeams(updatedTeams)
          
        } catch (error) {
          console.error('Error assigning team:', error)
        }
      }} className="space-y-4">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Select Participant</label>
          <select 
            name="userId" 
            required 
            className="w-full p-3 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Choose a participant...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || user.email} ({user.domain})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-2">Select Team</label>
          <select 
            name="teamId" 
            required 
            className="w-full p-3 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Choose a team...</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name} ({team.totalMembers}/{teamSize})
              </option>
            ))}
          </select>
        </div>
        
        <button 
          type="submit" 
          className="w-full p-4 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-lg font-bold flex items-center justify-center"
        >
          <UserCheck className="mr-2" size={20} />
          Assign to Team
        </button>
      </form>
    </motion.div>
  )

  const renderTracksTab = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl p-6 shadow-lg border border-indigo-100">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
              <Tag className="text-white" size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {editingTrack ? 'Edit Track' : 'Create Track'}
            </h2>
          </div>
          
          <form onSubmit={async (e) => {
            e.preventDefault()
            setIsSaving(true)
            
            try {
              const trackData = {
                name: newTrackName,
                description: newTrackDescription,
                color: newTrackColor
              }
              
              let response;
              
              if (editingTrack) {
                response = await fetch('/api/admin/tracks', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: editingTrack.id,
                    ...trackData
                  })
                })
              } else {
                response = await fetch('/api/admin/tracks', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(trackData)
                })
              }
              
              if (!response.ok) {
                throw new Error('Failed to save track')
              }
              
              // Refresh tracks
              const tracksResponse = await fetch('/api/admin/tracks')
              const tracksData = await tracksResponse.json()
              setTracks(tracksData)
              
              // Reset form
              setNewTrackName('')
              setNewTrackDescription('')
              setNewTrackColor('#6366F1')
              setEditingTrack(null)
            } catch (error) {
              console.error('Error saving track:', error)
            } finally {
              setIsSaving(false)
            }
          }} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Track Name</label>
              <input 
                type="text" 
                value={newTrackName} 
                onChange={e => setNewTrackName(e.target.value)} 
                required
                placeholder="e.g., AI Innovation" 
                className="w-full p-3 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Description</label>
              <textarea 
                value={newTrackDescription} 
                onChange={e => setNewTrackDescription(e.target.value)} 
                placeholder="Enter track description (optional)" 
                className="w-full p-3 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                rows={3}
              ></textarea>
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Color</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={newTrackColor} 
                  onChange={e => setNewTrackColor(e.target.value)} 
                  className="w-10 h-10 rounded-lg overflow-hidden cursor-pointer"
                />
                <input 
                  type="text" 
                  value={newTrackColor} 
                  onChange={e => setNewTrackColor(e.target.value)}
                  placeholder="#000000" 
                  className="w-full p-3 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button 
                type="submit" 
                disabled={isSaving}
                className={`flex-1 p-3 rounded-lg font-bold flex items-center justify-center transition-colors ${
                  isSaving 
                  ? 'bg-indigo-300 text-white cursor-not-allowed' 
                  : 'bg-indigo-500 text-white hover:bg-indigo-600'
                }`}
              >
                {isSaving ? 'Saving...' : editingTrack ? 'Update Track' : 'Create Track'}
              </button>
              
              {editingTrack && (
                <button 
                  type="button"
                  onClick={() => {
                    setEditingTrack(null)
                    setNewTrackName('')
                    setNewTrackDescription('')
                    setNewTrackColor('#6366F1')
                  }}
                  className="p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-lg border border-indigo-100">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
              <Layers className="text-white" size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Available Tracks</h2>
          </div>
          
          {tracks.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
              <Tag className="mx-auto text-gray-400 mb-3" size={30} />
              <p className="text-gray-500">No tracks have been created yet</p>
              <p className="text-gray-400 text-sm mt-1">Create a track to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tracks.map(track => (
                <div 
                  key={track.id} 
                  className="border border-gray-200 rounded-lg overflow-hidden"
                  style={{ borderLeftWidth: '4px', borderLeftColor: track.color || '#6366F1' }}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-800 text-lg">{track.name}</h3>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => {
                            setEditingTrack(track)
                            setNewTrackName(track.name)
                            setNewTrackDescription(track.description || '')
                            setNewTrackColor(track.color || '#6366F1')
                          }}
                          className="p-1 text-gray-500 hover:text-indigo-600 transition-colors"
                          title="Edit track"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to delete "${track.name}"?`)) {
                              try {
                                const response = await fetch(`/api/admin/tracks?id=${track.id}`, {
                                  method: 'DELETE'
                                })
                                
                                if (!response.ok) {
                                  throw new Error('Failed to delete track')
                                }
                                
                                // Refresh tracks
                                const tracksResponse = await fetch('/api/admin/tracks')
                                const tracksData = await tracksResponse.json()
                                setTracks(tracksData)
                              } catch (error) {
                                console.error('Error deleting track:', error)
                              }
                            }
                          }}
                          className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                          title="Delete track"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {track.description && (
                      <p className="text-gray-600 text-sm mb-2">{track.description}</p>
                    )}
                    
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center">
                        <Layers size={14} className="text-gray-500 mr-1" />
                        <span className="text-sm text-gray-500">
                          {track._count?.teams || 0} teams
                        </span>
                      </div>
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: track.color || '#6366F1' }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 bg-white rounded-xl p-6 shadow-lg border border-indigo-100">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
            <UserPlus className="text-white" size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Assign Tracks to Teams</h2>
        </div>
        
        <form onSubmit={async (e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          const teamId = formData.get('teamId')?.toString()
          const trackId = formData.get('trackId')?.toString()
          
          if (!teamId) return
          
          setIsSaving(true)
          try {
            const response = await fetch('/api/admin/assign-track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                teamId, 
                trackId: trackId === 'none' ? null : trackId
              })
            })
            
            if (!response.ok) {
              throw new Error('Failed to assign track')
            }
            
            // Refresh teams data
            const teamsResponse = await fetch('/api/admin/teams-with-users')
            const teamsData = await teamsResponse.json()
            setTeams(teamsData)
            
            e.currentTarget.reset()
          } catch (error) {
            console.error('Error assigning track:', error)
          } finally {
            setIsSaving(false)
          }
        }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Select Team</label>
            <select 
              name="teamId" 
              required 
              className="w-full p-3 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Choose a team...</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.totalMembers} members)
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">Select Track</label>
            <select 
              name="trackId" 
              className="w-full p-3 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="none">No track (remove assignment)</option>
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button 
              type="submit" 
              disabled={isSaving}
              className={`w-full p-3 rounded-lg font-bold flex items-center justify-center transition-colors ${
                isSaving 
                ? 'bg-indigo-300 text-white cursor-not-allowed' 
                : 'bg-indigo-500 text-white hover:bg-indigo-600'
              }`}
            >
              {isSaving ? 'Assigning...' : 'Assign Track'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  )
  
  const renderSettingsTab = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-indigo-100"
    >
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
          <SettingsIcon className="text-white" size={20} />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Event Settings</h2>
      </div>
      
      <form onSubmit={async (e) => {
        e.preventDefault()
        setIsSaving(true)
        
        try {
          const formData = new FormData(e.currentTarget)
          const deadline = formData.get('deadline')?.toString()
          const teamSize = parseInt(formData.get('teamSize')?.toString() || '5')
          const eventStarted = formData.get('eventStarted') === 'on'
          const eventEnded = formData.get('eventEnded') === 'on'
          const tracksEnabled = formData.get('tracksEnabled') === 'on'
          
          const response = await fetch('/api/admin/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deadline: deadline || null,
              teamSize,
              eventStarted,
              eventEnded,
              tracksEnabled
            })
          })
          
          if (!response.ok) {
            throw new Error('Failed to update settings')
          }
          
          // Update local config
          const updatedConfig = await response.json()
          setConfig(updatedConfig)
          setTeamSize(updatedConfig.teamSize || 5)
        } catch (error) {
          console.error('Error updating settings:', error)
        } finally {
          setIsSaving(false)
        }
      }} className="space-y-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Submission Deadline</label>
            <input 
              type="datetime-local" 
              name="deadline"
              defaultValue={config.deadline ? new Date(config.deadline).toISOString().slice(0, 16) : ''}
              className="w-full p-3 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <p className="text-gray-500 text-sm mt-1">Set the deadline for idea submissions</p>
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">Team Size</label>
            <input 
              type="number" 
              name="teamSize"
              min="2"
              defaultValue={config.teamSize}
              className="w-full p-3 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <p className="text-gray-500 text-sm mt-1">Maximum number of members per team</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-3">Event Status</h3>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="eventStarted" 
                name="eventStarted"
                defaultChecked={config.eventStarted}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label htmlFor="eventStarted" className="ml-2 block text-gray-700">
                Event has started
              </label>
            </div>
            
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="eventEnded" 
                name="eventEnded"
                defaultChecked={config.eventEnded}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label htmlFor="eventEnded" className="ml-2 block text-gray-700">
                Event has ended
              </label>
            </div>
            
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="tracksEnabled" 
                name="tracksEnabled"
                defaultChecked={config.tracksEnabled}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label htmlFor="tracksEnabled" className="ml-2 block text-gray-700">
                Enable tracks feature
              </label>
            </div>
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={isSaving}
          className={`w-full p-4 rounded-lg font-bold flex items-center justify-center transition-colors ${
            isSaving 
            ? 'bg-indigo-300 text-white cursor-not-allowed' 
            : 'bg-indigo-500 text-white hover:bg-indigo-600'
          }`}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gray-900 p-6 overflow-auto text-gray-100">
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-center mb-8"
      >
        <div className="bg-gray-800 rounded-full p-2 pl-8 pr-4 shadow-lg border border-gray-700 flex items-center">
          <h1 className="text-3xl font-extrabold text-pink-500 mr-4">Admin Dashboard</h1>
          <div className="bg-pink-500 p-2 rounded-full">
            <Megaphone className="text-gray-900" size={24} />
          </div>
        </div>
      </motion.div>
      
      <div className="max-w-[1400px] mx-auto">
        <div className="bg-gray-800 rounded-full mb-8 p-1 shadow-lg border border-gray-700">
          <div className="flex justify-between md:justify-center">
            <button 
              onClick={() => setActiveTab('stats')}
              className={`flex-1 md:flex-none px-4 py-3 rounded-full md:mx-2 font-semibold transition-all flex items-center justify-center ${
                activeTab === 'stats' ? 'bg-pink-500 text-gray-900 shadow-md' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <PieChart size={18} className="mr-2 hidden md:inline" />
              Statistics
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex-1 md:flex-none px-4 py-3 rounded-full md:mx-2 font-semibold transition-all flex items-center justify-center ${
                activeTab === 'users' ? 'bg-pink-500 text-gray-900 shadow-md' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Users size={18} className="mr-2 hidden md:inline" />
              Users
            </button>
            <button 
              onClick={() => setActiveTab('teams')}
              className={`flex-1 md:flex-none px-4 py-3 rounded-full md:mx-2 font-semibold transition-all flex items-center justify-center ${
                activeTab === 'teams' ? 'bg-pink-500 text-gray-900 shadow-md' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Layers size={18} className="mr-2 hidden md:inline" />
              Teams
            </button>
            <button 
              onClick={() => setActiveTab('tracks')}
              className={`flex-1 md:flex-none px-4 py-3 rounded-full md:mx-2 font-semibold transition-all flex items-center justify-center ${
                activeTab === 'tracks' ? 'bg-pink-500 text-gray-900 shadow-md' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Tag size={18} className="mr-2 hidden md:inline" />
              Tracks
            </button>
            <button 
              onClick={() => setActiveTab('assign')}
              className={`flex-1 md:flex-none px-4 py-3 rounded-full md:mx-2 font-semibold transition-all flex items-center justify-center ${
                activeTab === 'assign' ? 'bg-pink-500 text-gray-900 shadow-md' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <UserCheck size={18} className="mr-2 hidden md:inline" />
              Assign
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex-1 md:flex-none px-4 py-3 rounded-full md:mx-2 font-semibold transition-all flex items-center justify-center ${
                activeTab === 'settings' ? 'bg-pink-500 text-gray-900 shadow-md' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <SettingsIcon size={18} className="mr-2 hidden md:inline" />
              Settings
            </button>
          </div>
        </div>
        
        <div className="container mx-auto pb-12">
          {activeTab === 'stats' && renderStatsTab()}
          {activeTab === 'users' && renderUsersTab()}
          {activeTab === 'teams' && renderTeamsTab()}
          {activeTab === 'tracks' && renderTracksTab()}
          {activeTab === 'assign' && renderAssignTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </div>
      </div>
    </div>
  )
}
