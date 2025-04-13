"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function AuthError() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    setError(errorParam)
  }, [searchParams])

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Callback':
        return "There was a problem with the database connection. Please try again."
      case 'AccessDenied':
        return "You don't have permission to access this resource."
      case 'OAuthAccountNotLinked':
        return "Your account is already linked to a different sign-in method."
      default:
        return "An unknown error occurred during authentication. Please try again."
    }
  }

  return (
    <div className="min-h-screen w-full overflow-hidden relative bg-gradient-to-br from-pink-500 via-pink-400 to-pink-300 flex items-center justify-center">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-pink-500/20 to-pink-600/40 backdrop-blur-sm" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/20 backdrop-blur-md rounded-2xl overflow-hidden border-2 border-pink-200 shadow-lg p-8 max-w-md w-full relative z-10"
      >
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">Authentication Error</h2>
          <p className="text-pink-100">{getErrorMessage(error)}</p>
        </div>

        <div className="space-y-4">
          <div className="bg-white/10 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-2">Try These Solutions:</h3>
            <ul className="text-pink-100 space-y-2 list-disc pl-5">
              <li>Refresh the page and try signing in again</li>
              <li>Clear your browser cookies and cache</li>
              <li>Try a different browser</li>
              <li>Wait a few minutes and try again</li>
            </ul>
          </div>

          <Link 
            href="/"
            className="block w-full p-3 bg-pink-500 hover:bg-pink-600 transition-colors text-white font-bold rounded-lg text-center mt-6"
          >
            Return to Homepage
          </Link>
        </div>
      </motion.div>
    </div>
  )
} 