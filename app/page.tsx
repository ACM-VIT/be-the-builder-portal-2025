// app/page.tsx
"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, cubicBezier } from "framer-motion"
import { signIn, useSession } from "next-auth/react"
import dynamic from "next/dynamic"
import { SplineScene } from "@/components/spline-scene"
import { SplashCursor } from "@/components/splash-cursor"
import { Dashboard } from "@/components/dashboard"
import { NotificationProvider } from "@/lib/contexts/notification-context"

const AdminView = dynamic(() => import("@/components/admin-view"), { ssr: false })

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [isZooming, setIsZooming] = useState(false)
  const { data: session, status } = useSession()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignIn = async () => {
    if (status === "authenticated") return

    setIsZooming(true)
    setTimeout(() => {
      signIn("google", { callbackUrl: window.location.origin })
    }, 100)
  }

  const showDashboard = status === "authenticated" && session

  const isAdmin = session?.user?.isAdmin === true

  const ultraSlowAcceleration = cubicBezier(0.01, 0.0, 0.05, 1.0)

  return (
    <AnimatePresence mode="wait">
      {!showDashboard ? (
        <motion.div
          key="landing"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col min-h-screen bg-gradient-to-r from-violet-1000 via-violet-800 to-violet-1000 monospace cursor-pointer"
          onClick={handleSignIn}
          style={{ overflow: "hidden" }}
        >
          <SplashCursor />
          <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  perspective: "500px",
                  perspectiveOrigin: "center center",
                }}
              >
                <motion.div
                  style={{
                    width: "100%",
                    height: "100%",
                    transformStyle: "preserve-3d",
                  }}
                  animate={
                    isZooming
                      ? {
                          z: 2000,
                          scale: 2,
                          rotateX: 10,
                          rotateY: -7,
                        }
                      : {
                          z: 0,
                          scale: 1,
                          rotateX: 0,
                          rotateY: 0,
                        }
                  }
                  transition={{
                    duration: 6,
                    ease: ultraSlowAcceleration,
                  }}
                >
                  {mounted && (
                    <SplineScene
                      scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                      className="w-full h-full"
                    />
                  )}
                </motion.div>
              </div>

              <motion.div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `
                    repeating-radial-gradient(
                      circle at center,
                      transparent,
                      transparent 10px,
                      rgba(255, 255, 255, 0.05) 10px,
                      rgba(255, 255, 255, 0.05) 20px
                    )
                  `,
                  opacity: 0,
                  pointerEvents: "none",
                  zIndex: 7,
                  mixBlendMode: "overlay",
                }}
                animate={{
                  opacity: isZooming ? 0.7 : 0,
                  backgroundSize: isZooming ? "300% 300%" : "100% 100%",
                }}
                transition={{
                  duration: 6,
                  ease: ultraSlowAcceleration,
                }}
              />

              <motion.div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(circle at center, rgba(255,255,255,0.6) 0%, transparent 30%)",
                  opacity: 0,
                  pointerEvents: "none",
                  zIndex: 6,
                  mixBlendMode: "overlay",
                }}
                animate={{
                  opacity: isZooming ? 1 : 0,
                }}
                transition={{
                  duration: 6,
                  ease: ultraSlowAcceleration,
                }}
              />

              <motion.div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(255,182,193, 0)",
                  pointerEvents: "none",
                  zIndex: 8,
                }}
                animate={{
                  backgroundColor: isZooming ? "rgba(255,182,193, 0.8)" : "rgba(255,182,193, 0)",
                }}
                transition={{
                  duration: 6,
                  ease: ultraSlowAcceleration,
                }}
              />

              <motion.div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "1.5rem",
                  zIndex: 10,
                  textAlign: "center",
                }}
                animate={
                  isZooming
                    ? { opacity: 0, y: -100, scale: 0.7 }
                    : { opacity: 1, y: 0, scale: 1 }
                }
                transition={{ duration: 0.2, ease: ultraSlowAcceleration }}
              >
                <h1
                  className="pp-editorial"
                  style={{ fontSize: "clamp(2rem, 8vw, 6rem)", marginBottom: "1rem", color: "white" }}
                >
                  Be The Builder
                </h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{ color: "white", opacity: 0.8 }}
                >
                  Click anywhere to sign in with Google
                </motion.p>
              </motion.div>
            </div>
          </main>
        </motion.div>
      ) : (
        isAdmin ? (
          <NotificationProvider>
            <AdminView />
          </NotificationProvider>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <NotificationProvider>
              <Dashboard user={session.user!} />
            </NotificationProvider>
          </motion.div>
        )
      )}
    </AnimatePresence>
  )
}
