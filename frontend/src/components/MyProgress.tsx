import { useEffect, useState } from 'react'
import api from '../lib/api'

type ProgressRow = {
  id: number
  game_id?: number
  game_slug?: string
  game_title?: string
  level_reached?: number
  xp?: number
  completion_percent?: number
  updated_at?: string
}

export default function MyProgress() {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<ProgressRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await api.getMyProgress()
        if (mounted) {
          if (res?.error) setError(res.error)
          else setProgress(res.progress || [])
        }
      } catch (err: unknown) {
        if (mounted) setError((err as Error)?.message || 'Failed to fetch')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>
  if (error) return <div style={{ padding: 20, color: 'salmon' }}>Error: {error}</div>

  return (
    <div style={{ padding: 20 }}>
      <h2>My Progress</h2>
      {progress.length === 0 ? (
        <p>No saved progress yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Game</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Level</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Completion</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Updated</th>
            </tr>
          </thead>
          <tbody>
            {progress.map((p) => (
              <tr key={p.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <td style={{ padding: 8 }}>{p.game_title || p.game_slug}</td>
                <td style={{ padding: 8 }}>{p.level_reached}</td>
                <td style={{ padding: 8 }}>{p.completion_percent}%</td>
                <td style={{ padding: 8 }}>{p.updated_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
