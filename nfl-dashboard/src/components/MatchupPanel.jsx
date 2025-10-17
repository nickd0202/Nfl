import React, { useEffect, useState } from 'react'
import { prettyBroadcasts, fetchGameSummary } from '../utils/espn'

export default function MatchupPanel({ game, onClose }) {
  const [home, setHome] = useState({ leaders:null, injuries: [] })
  const [away, setAway] = useState({ leaders:null, injuries: [] })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ok = true
    async function load() {
      setError(null);
      try {
        const gameId = game.id; 
        if (!gameId) {
          throw new Error('Game ID is missing, cannot fetch summary.');
        }

        const { leaders, injuries } = await fetchGameSummary(gameId);

        const homeId = game.home.id;
        const awayId = game.away.id;

        setHome({
          leaders: leaders[homeId] || { passing: null, rushing: null, receiving: null },
          injuries: injuries[homeId] || []
        });
        setAway({
          leaders: leaders[awayId] || { passing: null, rushing: null, receiving: null },
          injuries: injuries[awayId] || []
        });

      } catch (err) {
        console.error('Failed to load matchup details:', err);
        setError(err.message || 'Failed to fetch game summary.'); 
        setHome({ leaders: null, injuries: [] }); 
        setAway({ leaders: null, injuries: [] });
      } finally {
        if (ok) setLoading(false);
      }
    }
    load();
    return () => { ok = false };
  }, [game]); 

  const broadcasts = prettyBroadcasts(game.broadcasts)

  const isFinal = game.status.toLowerCase().includes('final');
  const awayWon = isFinal && game.away.score > game.home.score;
  const homeWon = isFinal && game.home.score > game.away.score;
  let winnerText = 'TIE';
  if (awayWon) winnerText = `${game.away.abbr} Won`;
  if (homeWon) winnerText = `${game.home.abbr} Won`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="small">{game.when} • {game.venue}</div>
            <h2 style={{ margin: 0 }}>
              {game.away.abbr} @ {game.home.abbr}
            </h2>
          </div>
          <button className="button" onClick={onClose}>Close</button>
        </div>

        <section className="section">
          <h3>Where to watch / stream</h3>
          {broadcasts.length ? (
            <table className="table">
              <thead>
                <tr><th>Network</th><th>Streaming Suggestion</th></tr>
              </thead>
              <tbody>
              {broadcasts.map((b,i) => (
                <tr key={i}><td>{b.network}</td><td>{b.streaming}</td></tr>
              ))}
              </tbody>
            </table>
          ) : <div className="small">TBD</div>}
        </section>

        <section className="section">
          {isFinal ? (
            <>
              <h3>Final Score</h3>
              <div className="row" style={{ justifyContent: 'center', gap: '16px', fontSize: '1.1em' }}>
                <div style={{ fontWeight: homeWon ? 700 : 400, opacity: homeWon ? 1 : 0.7 }}>
                  {game.home.abbr}: {game.home.score}
                </div>
                <div style={{ fontWeight: awayWon ? 700 : 400, opacity: awayWon ? 1 : 0.7 }}>
                  {game.away.abbr}: {game.away.score}
                </div>
                <div className="badge" style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)', fontWeight: 600 }}>
                  {winnerText}
                </div>
              </div>
            </>
          ) : (
            <>
              <h3>Betting odds</h3>
              {game.odds ? (
                <div className="row">
                  <div className="badge">{game.odds.provider}</div>
                  <div>{game.odds.details}</div>
                  <div>O/U {game.odds.overUnder}</div>
                </div>
              ) : <div className="small">No odds available yet.</div>}
            </>
          )}
        </section>
        
        <section className="section">
          <h3>Player matchups (season leaders)</h3>
          {loading && <div className="small">Loading leaders…</div>}
          {!loading && !error && (
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>{game.away.abbr}</th>
                  <th>{game.home.abbr}</th>
                </tr>
              </thead>
              <tbody>
                <StatRow label="QB (Passing)" a={away.leaders?.passing} h={home.leaders?.passing} />
                <StatRow label="RB1 (Rushing)" a={away.leaders?.rushing} h={home.leaders?.rushing} />
                <StatRow label="WR1 (Receiving)" a={away.leaders?.receiving} h={home.leaders?.receiving} />
              </tbody>
            </table>
          )}
          {!loading && error && (
            <div className="small" style={{ color: 'var(--bad)'}}>
              Could not load leader data.
            </div>
          )}
          <div className="small">Values are season leader snapshots (ESPN). “displayValue” often represents per-game averages or headline stat; exact meaning varies by category.</div>
        </section>

        <section className="section">
          <h3>Injuries & statuses</h3>
          {loading && <div className="small">Checking injuries…</div>}
          
          {error && (
            <div className="small" style={{ color: 'var(--bad)', marginBottom: '10px' }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {!loading && !error && (
            <>
              <InjuryBlock team={game.away.abbr} rows={away.injuries} />
              <InjuryBlock team={game.home.abbr} rows={home.injuries} />
            </>
          )}
          <div className="small">If empty, there may be no listed injuries.</div>
        </section>
        
      </div>
    </div>
  )
}

function StatRow({ label, a, h }) {
  return (
    <tr>
      <td>{label}</td>
      <td>{a ? `${a.name} — ${a.value}` : '—'}</td>
      <td>{h ? `${h.name} — ${h.value}` : '—'}</td>
    </tr>
  )
}

function InjuryBlock({ team, rows }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="badge">{team}</div>
      {rows?.length ? (
        <table className="table" style={{ marginTop: 6 }}>
          <thead>
            <tr><th>Player</th><th>Pos</th><th>Status</th><th>Description</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.name}</td>
                <td>{r.position || '—'}</td>
                <td style={{ color: (r.status || '').toLowerCase().includes('out') ? 'var(--bad)' : 'var(--text)' }}>
                  {r.status || '—'}
                </td>
                <td>{r.description || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <div className="small">No listed injuries.</div>}
    </div>
  )
}