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

### Prerequisites
- Node.js (>=18)
- npm or yarn

### Installation
```bash
cd backend
npm install
```

### Run Application
```bash
cd backend
npm run dev
```

### Run Simulation
```bash
cd backend
npm run simulation
```

### Run Tests
```bashs
cd backend
npm test
```

---

## Future Improvements (Next Steps)
- Return consistent error codes (e.g., distinguish 400 vs 404 clearly).
- Add persistent storage (currently in-memory only).
- Add validation (maybe with Zod) + better logging
- Improve test coverage (edge cases, concurrency).
