# Backend Systems Challenge: Build a Distributed Grid-Based Game Engine

A simple Node.js + TypeScript backend for managing games and players.  
Includes player management, game logic (win/draw detection), REST API endpoints, and middleware for error handling and request logging.

---

## Features

- **Game Logic**
  - Create and manage grid-based games
  - Win condition checking (rows, columns, diagonals)
  - Draw condition checking (`only when all cells are filled with no winner`)
  - Game state transitions (`waiting → active → completed`)

- **Player Management**
  - Create, update, delete players
  - Email validation and uniqueness checks
  - Track player statistics (wins, losses, ties, efficiency)

- **API Endpoints**
  - RESTful routes for players and games
  - Input validation
  - Proper error handling

- **Middleware**
  - 404 and global error handling

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
- Return consistent error codes (e.g., distinguish 400 vs 404 clearly).
- Add persistent storage (currently in-memory only).
- Add validation (maybe with Zod) + better logging
- Improve test coverage (edge cases, concurrency).
