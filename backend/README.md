# Backend Systems Challenge: Build a Distributed Grid-Based Game Engine

A simple Node.js + TypeScript backend for managing games and players.  
Includes player management, game logic (win/draw detection) and REST API endpoint.

---

## Features

- **Game**
  - Create and manage grid-based games
  - Win condition checking (rows, columns, diagonals)
  - Draw condition checking (`only when all cells are filled with no winner`)
  - Game state transitions (`waiting → active → completed`)
  - Leaderboard (win count, efficiency)

- **Player**
  - Create, update, delete players
  - Email validation and uniqueness checks
  - Track player statistics (wins, losses, ties, efficiency)

- **API Endpoints**
  - RESTful routes for players and games
  - Input validation
  - Proper error handling

- **Middleware**
  - Error handling

- **Simulation Script (scripts/simulationAPI.ts)**
  - Example script to test endpoints with concurrent games

---

## Running the Project
```bash
cd backend
```

### Installation
```bash
npm install
```

### Run Application
```bash
npm run dev
```

### Run Simulation
```bash
npm run simulation
```

⚠️ 2 terminals: one for the API server and one for the simulation — otherwise the simulation won’t connect.

### Run Tests
```bash
npm test
```

---

## Future Improvements (Next Steps)
- Add persistent storage (currently in-memory only).
- Add validation (maybe with Zod) + better logging
- Improve test coverage (edge cases, concurrency).
