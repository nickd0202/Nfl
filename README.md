# NFL Matchup Planner
A clean and responsive React dashboard for viewing NFL game schedules, live scores, and detailed player matchups. This app fetches all data in real-time from the public ESPN API.

(You should add a screenshot here!) [Insert a screenshot of the main schedule view and the modal open]

## Features
Current Week: Automatically fetches and displays the current week of the NFL season on load.

Schedule Browser: View the schedule for any week, year, or season type (Preseason, Regular, Postseason).

### Game Cards:

For upcoming games, shows betting odds and network broadcast information.

For completed games, shows the final score and highlights the winner.

Detailed Matchup Modal: Clicking a game card opens a modal with in-depth information:

Broadcasts: A clean list of TV networks and streaming suggestions.

Odds / Score: Shows betting odds for future games or the final score for past games.

Player Matchups: A side-by-side comparison of team season leaders (Passing, Rushing, Receiving).

Injuries: A full, up-to-date injury report for both teams, including player, position, status, and injury details.

Responsive Design: The layout is fully responsive and works cleanly on both desktop and mobile devices.

### Tech Stack
Frontend: React (Vite)

Data: Live data from the ESPN Site API

Styling: Modern CSS with CSS Variables

Dependencies: react, react-dom, @fontsource-variable/inter
