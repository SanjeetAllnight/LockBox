'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function IntroAnimation() {
  const [show, setShow] = useState(false)
  const [mounted, setMounted] = useState(false) // Wait to check localStorage until mounted

  useEffect(() => {
    // Only run on client after hydration
    setMounted(true)
    const hasSeen = sessionStorage.getItem('lockbox_intro_seen')
    if (!hasSeen) {
      setShow(true)
    }
  }, [])

  const handleAnimationComplete = () => {
    setTimeout(() => {
      setShow(false)
      sessionStorage.setItem('lockbox_intro_seen', 'true')
    }, 1500) // Stay on screen for 1.5 seconds after assembling before fading out
  }

  // Split "LockBox" into characters
  const letters = 'LockBox'.split('')

  if (!mounted) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden"
        >
          {/* Subtle background glow behind the text */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 1.5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/20 blur-[100px] rounded-full pointer-events-none"
          />

          <div className="flex z-10">
            {letters.map((char, index) => {
              // Scatter text randomly for initial state
              const randomX = (Math.random() - 0.5) * 800
              const randomY = (Math.random() - 0.5) * 800
              const randomRotation = (Math.random() - 0.5) * 180

              return (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, x: randomX, y: randomY, rotate: randomRotation, scale: 0.2 }}
                  animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
                  transition={{
                    type: 'spring',
                    damping: 12,
                    stiffness: 70,
                    delay: 0.1 * index,
                    mass: 0.8
                  }}
                  className={`text-6xl md:text-8xl font-black drop-shadow-2xl ${
                    char === 'B' || char === 'L' ? 'text-primary' : 'text-white'
                  }`}
                  onAnimationComplete={
                    index === letters.length - 1 ? handleAnimationComplete : undefined
                  }
                >
                  {char}
                </motion.span>
              )
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8, ease: 'easeOut' }}
            className="mt-8 text-lg md:text-xl text-primary/80 font-medium tracking-wide z-10"
          >
            Your APIs are talking. Now you can listen.
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
