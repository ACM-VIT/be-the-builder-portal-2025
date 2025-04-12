"use client"

import { motion } from "framer-motion"
import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

interface DashboardProps {
  user: any
}

export function Dashboard({ user }: DashboardProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to right, #f0f9ff, #e0f2fe, #f0f9ff)",
        padding: "2rem",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          background: "white",
          borderRadius: "1rem",
          padding: "2rem",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: "2rem", fontWeight: "bold" }}
          >
            Welcome, {user?.name || "Builder"}
          </motion.h1>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Button
              variant="outline"
              onClick={() => signOut()}
              style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
              <LogOut size={16} />
              Sign Out
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {[1, 2, 3, 4].map((item) => (
            <motion.div
              key={item}
              whileHover={{ y: -5, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)" }}
              style={{
                background: "white",
                borderRadius: "0.75rem",
                padding: "1.5rem",
                border: "1px solid #f1f5f9",
                height: "200px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>Project {item}</h3>
              <p style={{ color: "#64748b", textAlign: "center" }}>
                Your project description goes here. Click to explore.
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
