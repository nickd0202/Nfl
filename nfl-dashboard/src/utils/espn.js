const fmt = new Intl.DateTimeFormat(undefined, {
  weekday: 'short', month: 'short', day: 'numeric',
  hour: 'numeric', minute: '2-digit'
})

const mapNetworkToStreaming = (network) => {
  const n = (network || '').toUpperCase()
  if (n.includes('CBS')) return 'CBS (Paramount+)'
  if (n.includes('FOX')) return 'FOX (Fox Sports app)'
  if (n.includes('NBC')) return 'NBC (Peacock)'
  if (n.includes('ESPN')) return 'ESPN/ESPN2 (ESPN app)'
  if (n.includes('ABC')) return 'ABC (ESPN app)'
  if (n.includes('NFLN')) return 'NFL Network (NFL+)'
  if (n.includes('AMAZON') || n.includes('PRIME')) return 'Prime Video'
  return network || '—'
}

export function prettyBroadcasts(broadcasts) {
  const uniq = [...new Set(broadcasts || [])]
  return uniq.map(n => ({ network: n, streaming: mapNetworkToStreaming(n) }))
}

export async function fetchWeekSchedule({ year, week, seasonType = 2 }) {
  const base = `/espn-site/apis/site/v2/sports/football/nfl/scoreboard`
  const urls = [
    `${base}?dates=${year}&seasontype=${seasonType}&week=${week}`,
    `${base}?seasontype=${seasonType}&week=${week}`
  ]

  let data = null
  for (const url of urls) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      data = await res.json()
      break
    } catch {
    }
  }
  if (!data) return []

  const events = Array.isArray(data.events) ? data.events : []
  const safe = []

  for (const e of events) {
    const comp = e?.competitions?.[0]
    const competitors = comp?.competitors || []
    const home = competitors.find(c => c.homeAway === 'home')
    const away = competitors.find(c => c.homeAway === 'away')
    if (!home || !away) continue 

    const odds = comp?.odds?.[0] || null
    const broadcasts = [
      ...(comp?.broadcasts || []).map(b => b?.names?.[0]).filter(Boolean),
      ...(comp?.geoBroadcasts || []).map(g => (g?.market?.type + ' ' + (g?.media?.shortName || ''))).filter(Boolean)
    ]
    const venue = comp?.venue?.fullName
    const city = comp?.venue?.address?.city
    const state = comp?.venue?.address?.state

    const toTeam = (c) => ({
      id: c?.team?.id || '',
      name: c?.team?.displayName || '',
      abbr: c?.team?.abbreviation || '',
      logo: c?.team?.logo || c?.team?.logos?.[0]?.href || '',
      score: Number(c?.score ?? 0),
      homeAway: c?.homeAway || '',
      record: c?.records?.[0]?.summary || ''
    })

    safe.push({
      id: e?.id || crypto.randomUUID?.() || String(Math.random()),
      date: e?.date || '',
      when: e?.date ? fmt.format(new Date(e.date)) : 'TBD',
      status: e?.status?.type?.name || '',
      venue: venue && city ? `${venue} (${city}${state ? ', ' + state : ''})` : (venue || ''),
      broadcasts,
      odds: odds ? {
        provider: odds?.provider?.name || 'Odds',
        details: odds?.details || '',
        spread: odds?.spread || '',
        overUnder: odds?.overUnder || ''
      } : null,
      home: toTeam(home),
      away: toTeam(away),
    })
  }

  return safe
}

export async function fetchGameSummary(gameId) {
  const url = `/espn-site/apis/site/v2/sports/football/nfl/summary?event=${gameId}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch game summary (HTTP ${res.status})`);
  }

  const data = await res.json();

  const leadersByTeam = {};
  (data.leaders || []).forEach(teamLeaderData => {
    const teamId = teamLeaderData?.team?.id;
    if (!teamId) return;

    leadersByTeam[teamId] = {
      passing: null,
      rushing: null,
      receiving: null,
    };

    (teamLeaderData.leaders || []).forEach(category => {
      const catName = category.name;
      const leader = category.leaders?.[0];
      if (!leader) return;

      const leaderData = {
        name: leader.athlete?.displayName || 'N/A',
        value: leader.displayValue || '—',
      };

      if (catName === 'passingYards') {
        leadersByTeam[teamId].passing = leaderData;
      } else if (catName === 'rushingYards') {
        leadersByTeam[teamId].rushing = leaderData;
      } else if (catName === 'receivingYards') {
        leadersByTeam[teamId].receiving = leaderData;
      }
    });
  });
  
  const injuriesByTeam = {};
  (data.injuries || []).forEach(teamInjuryData => {
    const teamId = teamInjuryData?.team?.id;
    if (!teamId) return;
    
    injuriesByTeam[teamId] = [];
    
    (teamInjuryData.injuries || []).forEach(player => {
      injuriesByTeam[teamId].push({
        name: player.athlete?.displayName || player.fullName || 'N/A',
        position: player.athlete?.position?.abbreviation || 'N/A',
        status: player.status || 'N/A',
        
        description: player.details?.type || player.details?.location || player.type?.description || '—',
      });
    });
  });

  return {
    leaders: leadersByTeam,
    injuries: injuriesByTeam,
  };
}

export async function fetchCurrentWeek() {
  const url = '/espn-site/apis/site/v2/sports/football/nfl/scoreboard'
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    
    return {
      week: data?.week?.number || null,
      seasonType: data?.season?.type || 2
    }
  } catch (e) {
    console.error('Could not fetch current week', e)
    return null
  }
}