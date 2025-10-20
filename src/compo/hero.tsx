import { Suspense, useEffect, useState, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

type ModelProps = {
  modelPath: string
  shouldDance: boolean
  onDanceComplete: () => void
}

function Model({ modelPath, shouldDance, onDanceComplete }: ModelProps) {
  const gltf = useGLTF(modelPath)
  const { actions, mixer } = useAnimations(gltf.animations, gltf.scene)
  const isInitialized = useRef(false)
  
  // Initialize praying animation only once
  useEffect(() => {
    if (isInitialized.current) return
    
    const prayAction = actions['praying']
    if (prayAction) {
      prayAction.loop = THREE.LoopRepeat
      prayAction.play()
      isInitialized.current = true
    }
  }, [actions])
  
  // Handle dance transitions
  useEffect(() => {
    const prayAction = actions['praying']
    const danceAction = actions['Dance']
    
    if (!prayAction || !danceAction) return
    
    danceAction.loop = THREE.LoopOnce
    danceAction.clampWhenFinished = true
    
    if (shouldDance) {
      prayAction.fadeOut(0.5)
      danceAction.reset()
      danceAction.fadeIn(0.5)
      danceAction.play()
      
      const onFinished = (e: any) => {
        if (e.action === danceAction) {
          onDanceComplete() // triggers page refresh
        }
      }
      
      mixer?.addEventListener('finished', onFinished)
      return () => mixer?.removeEventListener('finished', onFinished)
    } else if (isInitialized.current && !prayAction.isRunning()) {
      danceAction.fadeOut(0.5)
      prayAction.reset()
      prayAction.fadeIn(0.5)
      prayAction.play()
    }
  }, [shouldDance, actions, mixer, onDanceComplete])
  
  gltf.scene.scale.set(1.5, 1.5, 1.5)
  gltf.scene.position.set(0, -1.5, 0)
  
  return <primitive object={gltf.scene} />
}

export default function ThreeModel() {
  const [shouldDance, setShouldDance] = useState(false)
  const [hasDanced, setHasDanced] = useState(false) // prevents multiple dances
  const [noButtonPosition, setNoButtonPosition] = useState<{top: number, left: number} | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/music3.mp3')
    audioRef.current.volume = 0.5
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])
  
  const handleDanceClick = () => {
    if (hasDanced) return // prevent multiple dances
    setShouldDance(true)
    setHasDanced(true) // mark dance as done

    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(console.error)
      
      // Stop music after 20 seconds
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        }
      }, 20000)
    }
  }
  
  const handleDanceComplete = () => {
    setShouldDance(false)
    // Refresh page after dance finishes
    setTimeout(() => window.location.reload(), 500)
  }
  
  const moveNoButton = () => {
    const buttonWidth = isMobile ? 100 : 120
    const buttonHeight = 60
    const maxWidth = window.innerWidth - buttonWidth
    const maxHeight = window.innerHeight - buttonHeight
    
    const newTop = Math.random() * maxHeight
    const newLeft = Math.random() * maxWidth
    setNoButtonPosition({ top: newTop, left: newLeft })
  }
  
  const handleNoHover = () => moveNoButton()
  const handleNoClick = () => moveNoButton()
  
  return (
    <>
      <div style={{
        position: 'fixed',
        top: isMobile ? '20px' : '50px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        textAlign: 'center',
        padding: '0 20px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <h1 style={{
          fontSize: isMobile ? '24px' : '42px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: 0,
          textShadow: '0 2px 10px rgba(59, 130, 246, 0.3)'
        }}>
          Would You Hire Me? 🤔
        </h1>
      </div>
      
      <button
        onClick={handleDanceClick}
        disabled={shouldDance || hasDanced} // disable after first dance
        style={{
          position: 'fixed',
          bottom: isMobile ? '40px' : '80px',
          left: isMobile ? '30%' : '35%',
          transform: isMobile ? 'translateX(-70px)' : 'translateX(-85px)',
          zIndex: 1000,
          padding: isMobile ? '16px 40px' : '20px 50px',
          fontSize: isMobile ? '18px' : '22px',
          fontWeight: '700',
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          cursor: shouldDance || hasDanced ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s',
          boxShadow: '0 6px 25px rgba(16, 185, 129, 0.4)',
          opacity: shouldDance || hasDanced ? 0.6 : 1,
          whiteSpace: 'nowrap'
        }}
      >
        ✅ Yes
      </button>
      
      {noButtonPosition === null ? (
        <button
          disabled={shouldDance || hasDanced}
          onMouseEnter={handleNoHover}
          onClick={!shouldDance && !hasDanced ? handleNoClick : undefined}
          onTouchStart={!shouldDance && !hasDanced ? handleNoClick : undefined}
          style={{
            position: 'fixed',
            bottom: isMobile ? '40px' : '80px',
            left: isMobile ? '50%' : '60%',
            transform: isMobile ? 'translateX(12px)' : 'translateX(15px)',
            zIndex: 1000,
            padding: isMobile ? '16px 40px' : '20px 50px',
            fontSize: isMobile ? '18px' : '22px',
            fontWeight: '700',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            cursor: shouldDance || hasDanced ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease-out',
            boxShadow: '0 6px 25px rgba(239, 68, 68, 0.4)',
            whiteSpace: 'nowrap',
            opacity: shouldDance || hasDanced ? 0.6 : 1,
          }}
        >
          ❌ No
        </button>
      ) : (
        <button
          disabled={shouldDance || hasDanced}
          onMouseEnter={handleNoHover}
          onClick={handleNoClick}
          onTouchStart={handleNoClick}
          style={{
            position: 'fixed',
            top: `${noButtonPosition.top}px`,
            left: `${noButtonPosition.left}px`,
            padding: isMobile ? '16px 40px' : '20px 50px',
            fontSize: isMobile ? '18px' : '22px',
            fontWeight: '700',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            cursor: shouldDance || hasDanced ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease-out',
            boxShadow: '0 8px 30px rgba(239, 68, 68, 0.4)',
            zIndex: 1000,
            whiteSpace: 'nowrap',
            opacity: shouldDance || hasDanced ? 0.6 : 1,
          }}
        >
          ❌ No
        </button>
      )}
      
      <div style={{ width: '100vw', height: '100vh' }}>
        <Canvas 
          camera={{ position: [0, 0.5, 4.5], fov: 50 }}
          gl={{ alpha: true, antialias: true }}
          onCreated={({ gl, camera }) => {
            gl.setClearColor(0xf0f0f0, 1)
            camera.lookAt(0, 0, 0)
          }}
        >
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 5, 5]} intensity={2} />
          <directionalLight position={[-5, 3, -5]} intensity={1} />
          <Suspense fallback={null}>
            <Model 
              modelPath="myModel.glb" 
              shouldDance={shouldDance}
              onDanceComplete={handleDanceComplete}
            />
          </Suspense>
        </Canvas>
      </div>
    </>
  )
}
