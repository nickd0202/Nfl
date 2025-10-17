import React from 'react'

export default function ScheduleList({ games, onOpen }) {
  if (!games?.length) {
    return <div className="small">No games found for this selection.</div>
  }

  return (
    <div className="grid">
      {games.map(g => {
        const isFinal = g.status.toLowerCase().includes('final');
        const awayWon = isFinal && g.away.score > g.home.score;
        const homeWon = isFinal && g.home.score > g.away.score;

        let winnerText = 'TIE';
        if (awayWon) winnerText = `${g.away.abbr} Won`;
        if (homeWon) winnerText = `${g.home.abbr} Won`;
        
        const winningScore = Math.max(g.away.score, g.home.score);
        const losingScore = Math.min(g.away.score, g.home.score);

        return (
          <article key={g.id} className="card" onClick={() => onOpen(g)}>
            <div className="row">
              <div className="badge">{g.when}</div>
              <div className="small">{g.venue?.split('(')[0]?.trim()}</div>
            </div>

            <div className="teams">
              <TeamSide t={g.away} align="right" isFinal={isFinal} isWinner={awayWon} />
              <div className="vs">{isFinal ? 'Final' : 'vs'}</div>
              <TeamSide t={g.home} align="left" isFinal={isFinal} isWinner={homeWon} />
            </div>

            <div className="row">
              <div className="small">
                {g.broadcasts?.length ? g.broadcasts.join(' • ') : '—'}
              </div>

              {isFinal && (
                <div className="badge" style={{ backgroundColor: 'var(--accent)', color: 'var(--bg)', fontWeight: 600 }}>
                  {winnerText}: {winningScore} - {losingScore}
                </div>
              )}

              {!isFinal && g.odds?.details && (
                <div className="badge">{g.odds.provider}: {g.odds.details} • O/U {g.odds.overUnder}</div>
              )}
            </div>
            
          </article>
        )
      })}
    </div>
  )
}

function TeamSide({ t, align, isFinal, isWinner }) {
  const teamStyle = {
    justifySelf: align === 'right' ? 'end' : 'start',
    opacity: (isFinal && !isWinner) ? 0.6 : 1
  };

  const textContainerStyle = {
    display: 'grid',
    textAlign: align === 'right' ? 'right' : 'left'
  };

  return (
    <div className="team" style={teamStyle}>
      {align === 'left' && <img src={t.logo} alt="" width="26" height="26" />}
      
      <div style={textContainerStyle}>
        <div style={{ fontWeight: 700 }}>
          {t.abbr} <span className="small" style={{ fontWeight: 400 }}>({t.record})</span>
        </div>
        <div className="small">{t.name}</div>
      </div>

      {align === 'right' && <img src={t.logo} alt="" width="26" height="26" />}
    </div>
  )
}