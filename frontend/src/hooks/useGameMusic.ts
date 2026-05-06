import { useEffect } from 'react'
import { audioManager } from '../lib/AudioManager'

export function useGameMusic(track: string) {
  useEffect(() => {
    audioManager.playMusic(track)
    return () => audioManager.stopMusic(800)
  }, [track])
}
