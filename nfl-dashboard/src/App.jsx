import React, { useEffect, useMemo, useState } from 'react'
import ScheduleList from './components/ScheduleList.jsx'
import MatchupPanel from './components/MatchupPanel.jsx'
import { fetchWeekSchedule, fetchCurrentWeek } from './utils/espn.js'

const currentYear = new Date().getFullYear()

export default function App() {
  const [year, setYear] = useState(currentYear)
  const [week, setWeek] = useState(null)
  const [seasonType, setSeasonType] = useState(null)
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openGame, setOpenGame] = useState(null)

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      const current = await fetchCurrentWeek();
      if (isMounted) {
        if (current) {
          setWeek(current.week || 1);
          setSeasonType(current.seasonType || 2);
        } else {
          setWeek(1);
          setSeasonType(2);
        }
      }
    })();
    return () => { isMounted = false };
  }, []);

  useEffect(() => {
    if (week === null || seasonType === null) {
      return; 
    }
    
    let isMounted = true
    ;(async () => {
      setLoading(true); setError('')
      try {
        const list = await fetchWeekSchedule({ year, week, seasonType })
        if (isMounted) setGames(list)
        console.log('scoreboard games:', list)
      } catch (e) {
        console.error('fetch error:', e)
        if (isMounted) setError(String(e?.message || e))
      } finally {
        if (isMounted) setLoading(false)
      }
    })()
    return () => { isMounted = false }
  }, [year, week, seasonType])

  const weeks = useMemo(() => {
    const max = seasonType === 2 ? 18 : (seasonType === 3 ? 5 : 4)
    return Array.from({ length: max }, (_, i) => i + 1)
  }, [seasonType])

  if (week === null || seasonType === null) {
    return (
      <div className="app">
        <div className="small" style={{ padding: 20, textAlign: 'center' }}>
          Loading current week...
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div style={{
        fontSize:12, opacity:.8, marginBottom:8, padding:6,
        border:'1px dashed #273057', borderRadius:8
      }}>
        status: {loading ? 'loading…' : 'ok'} • games: {games.length} {error && `• error: ${error}`}
      </div>

      <div className="header">
        <div className="h1">NFL Schedule & Matchups</div>
        <div className="controls">
          <select className="select" value={seasonType} onChange={e => setSeasonType(Number(e.target.value))}>
            <option value={1}>Preseason</option>
            <option value={2}>Regular</option>
            <option value={3}>Postseason</option>
          </select>
          <select className="select" value={year} onChange={e => setYear(Number(e.target.value))}>
            {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(y =>
              <option key={y} value={y}>{y}</option>
            )}
          </select>
          <select className="select" value={week} onChange={e => setWeek(Number(e.target.value))}>
            {weeks.map(w => <option key={w} value={w}>Week {w}</option>)}
          </select>
          <button className="button" onClick={() => location.reload()}>Refresh</button>
        </div>
      </div>

      {loading && <div className="small">Loading schedule…</div>}
      {error && <div className="small" style={{ color:'#ff8c8c' }}>{error}</div>}
      {!loading && !error && (games.length ? (
        <ScheduleList games={games} onOpen={setOpenGame} />
      ) : (
        <div className="small">No games found for this selection.</div>
      ))}

      {openGame && (
        <MatchupPanel
          game={openGame}
          onClose={() => setOpenGame(null)}
        />
      )}

    </div>
  )
}