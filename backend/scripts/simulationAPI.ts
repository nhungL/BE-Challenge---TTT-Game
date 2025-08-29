import axios from "axios"; 
import { SimulationConfig, SimulationResult, PlayerInfo, Game } from "../src/types";

const baseUrl = "http://127.0.0.1:4000";
type SimPlayer = { id: string; name: string; email: string };

class GameSimulation {
    private config: SimulationConfig;
    private results: SimulationResult;
    private players: SimPlayer[] = [];

    constructor(config: SimulationConfig) {
        this.config = config;
        this.results = {
            totalGames: 0,
            completedGames: 0,
            failedGames: 0,
            totalMoves: 0,
            averageMovesPerGame: 0,
            playerStats: [],
            leaderboard: [],
            duration: 0,
            errors: []
        };
    }

    // run the simulation
    async runSimulation(): Promise<SimulationResult> {
        console.log("***** ⚙️ START SIMULATION ⚙️ *****");
        console.log(`Running ${this.config.numGames} games with concurrency of ${this.config.concurrentGames} and ${this.config.numPlayers} players.`);
        const startTime = Date.now();

        try {
            // Create players once for all games
            console.log("-".repeat(40));
            await this.createPlayers();

            // Run games concurrently in batches
            console.log("-".repeat(40));
            await this.runConcurrentGames();

            // Calculate final stats
            console.log("-".repeat(40));
            await this.getAllPlayerStats();
            await this.updateLeaderBoardStats();

            this.results.duration = Date.now() - startTime;
            console.log("-".repeat(40));
            console.log("\n\nSimulation completed.");

            this.printSimulationResults();
            return this.results;
        } catch (error) {
            console.error("Simulation failed:", error);
            this.results.errors.push((error as Error).message);
        }

        this.results.duration = Date.now() - startTime;
        console.log("Final Results:", this.results);
        console.log("Simulation completed in ", this.results.duration, "ms");
        return this.results;

    }

    async createPlayers() {
        console.log("\nInitializing players using API...");
        for (let i = 0; i < this.config.numPlayers; i++) {
            const player = {name: `Player${i + 1}`, email: `${i+1}@email.com`}
            const res = await axios.post(`${baseUrl}/players/create`, 
                player, 
                {
                    headers: { 'Content-Type': 'application/json' }, 
                    timeout: 5000,
                }
            );
            if (res.status !== 200 && res.status !== 201) {
                throw new Error(`Failed to create player ${player.name}: ${res.statusText}`);
            }
            const playerData = res.data;
            this.players.push(playerData);
            console.log(`   Created player: ${player.name} (ID: ${playerData.id})`);
        }   
        console.log(`Initialized ${this.players.length} players.`);
    }

    // run multiple games concurrently
    private async runConcurrentGames() {
        console.log("\nRunning concurrent games...");
        for (let i = 0; i < this.config.numGames; i += this.config.concurrentGames) {
            const batchPromises: Promise<void>[] = [];
            const batchIndex = i / this.config.concurrentGames + 1;
            const batchSize = Math.min(this.config.concurrentGames, this.config.numGames - i);
            console.log(`\n---Batch ${batchIndex} (${batchSize} games)---`);
            for (let j = 0; j < batchSize && (i + j) < this.config.numGames; j++) {
                batchPromises.push(this.runSingleGame(i + j + 1));
            }
            await Promise.all(batchPromises);
        }
    }   

    // simulate a single game
    private async runSingleGame(gameNumber: number) {
        this.results.totalGames += 1;
        try {
            // Create game
            const gameName = "Tic-tac-toe " + gameNumber
            let game = await this.createGame(gameName);
            
            // Select 2 players for the game
            const p1 = this.players[(gameNumber) % this.players.length];
            const p2 = this.players[(gameNumber + this.config.concurrentGames - 1) % this.players.length];
            console.log(`   ${game.name} - Selected players: ${p1.name}, ${p2.name}`);

            // Add players to game
            game = await this.addPlayer(game.id, p1);
            game = await this.addPlayer(game.id, p2);

            // Make random moves until game ends
            console.log(`   ${game.name}(status: ${game.status}) - Players added. Starting playing...`);
            while (game.status === "active") {
                const currentPlayerId = game.currentPlayerId;
                const current = currentPlayerId === p1.id ? p1.name : p2.name;
                let row: number, col: number;
                do {
                    row = Math.floor(Math.random() * game.board.length);
                    col = Math.floor(Math.random() * game.board.length);
                } while (game.board[row][col] !== null);
                game = await this.makeMove(game.id, currentPlayerId, row, col);
                console.log(`      ${game.name} - ${current} placed at (${row}, ${col})`);
            }

            if (game.status !== "completed") {
                throw new Error(`Game did not complete properly, final status: ${game.status}`);
            }
            const winner = game.winnerId === p1.id ? p1 : game.winnerId === p2.id ? p2 : null; 
            console.log(`Game ${game.name} finished: ${game.result.toUpperCase()}${winner ? ` (winner=${winner.name})` : ""}. Total moves: ${game.moves.length}`);

            this.results.completedGames += 1;

        } catch (error) {
            console.error(`     Game ${gameNumber} failed:`, error);
            this.results.failedGames += 1;
            this.results.errors.push(`Game ${gameNumber}: ${(error as Error).message}`);
        }
    }


    // API Helpers
    private async createGame(name?: string) {
        const payload = name?.trim() ? { name: name.trim() } : {};
        const res = await axios.post(`${baseUrl}/games/create`, payload, {
            headers: { 'Content-Type': 'application/json' }, 
            timeout: 5000,
        });
        if (res.status !== 200 && res.status !== 201) {
            throw new Error(`Failed to create game: ${res.statusText}`);
        }
        return res.data;
    }   

    private async addPlayer(gameId: string, player: SimPlayer) {
        const payload = { player: player};
        const res = await axios.post(`${baseUrl}/games/${gameId}/join`, payload, {
            headers: { 'Content-Type': 'application/json' }, 
            timeout: 5000,
        });
        if (res.status !== 200 && res.status !== 201) {
            throw new Error(`Failed to add player ${player.name} to game ${gameId}: ${res.statusText}`);
        }   
        return res.data;
    }

    private async makeMove(gameId: string, playerId: string, row: number, col: number): Promise<Game> {
        const payload = { playerId, row, col };
        const res = await axios.post(`${baseUrl}/games/${gameId}/moves`, payload, {
            headers: { 'Content-Type': 'application/json' }, 
            timeout: 5000,
        });
        if (res.status !== 200 && res.status !== 201) {
            throw new Error(`Failed to make move for player ${playerId} in game ${gameId}: ${res.statusText}`);
        }   

        return res.data.game;
    }

    private async getAllPlayerStats(): Promise<PlayerInfo[]> {
        const res = await axios.get(`${baseUrl}/players/allstats`, {
            headers: { 'Content-Type': 'application/json' }, 
            timeout: 5000,
        });
        if (res.status !== 200 && res.status !== 201) {
            throw new Error(`Failed to get player stats: ${res.statusText}`);
        }
        this.results.playerStats = res.data as PlayerInfo[];
        console.log("Fetched player stats.");
        return res.data;
    }

    private async updateLeaderBoardStats() {
        console.log("\nUpdating leaderboard...");
        
        this.results.totalMoves = this.results.playerStats.reduce((sum, p) => sum + p.totalMoves, 0);
        this.results.averageMovesPerGame = this.results.completedGames > 0 ? this.results.totalMoves / this.results.completedGames : 0;

        // Create leaderboard sorted by wins or efficiency
        this.results.leaderboard = this.results.playerStats
            .filter(p => p.gamesPlayed > 0)
            .sort((a, b) => {
                if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon;
                return a.efficiency - b.efficiency; // lower number is better
            })
            .map(p => ({
                playerId: p.playerId,
                playerName: p.playerName,
                wins: p.gamesWon,
                winRate: Number(p.winRate.toFixed(2)),
                efficiency: Number(p.efficiency.toFixed(2))
            }));
        console.log("Leaderboard updated.");
    }

    private printSimulationResults() {
        console.log("\n***** 🎯 SIMULATION RESULTS 🎯 *****\n");
        console.log(`Total Games: ${this.results.totalGames}`);
        console.log(`Completed Games: ${this.results.completedGames}`);
        console.log(`Failed Games: ${this.results.failedGames}`);
        console.log(`Total Moves: ${this.results.totalMoves}`);
        console.log(`Average Moves per Game: ${this.results.averageMovesPerGame.toFixed(2)}`);
        console.log(`Duration: ${this.results.duration} ms`);
        
        console.log("\n***** 🏆 LEADERBOARD 🏆*****");
        console.table(this.results.leaderboard.slice(0, 3), ["playerName", "wins", "winRate", "efficiency"]);   

        if (this.results.errors.length > 0) {
            console.log("\nErrors:");
            this.results.errors.forEach(err => console.log(`- ${err}`));
        }
    } 
}

// To run the simulation directly
async function main() {
    const config: SimulationConfig = {
        numGames: 10, // total number of games to simulate
        concurrentGames: 3, // number of games to run in parallel
        numPlayers: 5 // total number of players in the simulation
    };
    const simulation = new GameSimulation(config);
    const results = await simulation.runSimulation();
    return results;
}

main().catch(console.error);
