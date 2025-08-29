import { GameModel } from "../src/models/gameModel";
import { PlayerModel } from "../src/models/playerModel";
import { GameService } from "../src/services/gameService";
import { SimulationConfig, SimulationResult, PlayerInfo } from "../src/types";

const gameModel = new GameModel();
const playerModel = new PlayerModel();      
const gameService = new GameService(gameModel, playerModel);

class GameSimulation {
    private config: SimulationConfig;
    private results: SimulationResult;
    private players: string[] = [];

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
        console.log("\nInitializing players...");
        for (let i = 0; i < this.config.numPlayers; i++) {
            const player = await playerModel.createPlayer(`Player_${i+1}`, `${i+1}@email.com`);
            this.players.push(player.id);
            console.log(`   Created player: ${player.name} (ID: ${player.id})`);
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
            
            // Randomly select 2 players for the game
            const playerIndices = new Set<number>();
            while (playerIndices.size < 2) {
                playerIndices.add(Math.floor(Math.random() * this.players.length));
            }
            const [p1Index, p2Index] = Array.from(playerIndices);
            const p1 = await playerModel.getPlayerById(this.players[p1Index]) as any;
            const p2 = await playerModel.getPlayerById(this.players[p2Index]) as any;
            console.log(`   ${game.name} - Selected players: ${p1.name}, ${p2.name}`);

            // Add players to game
            game = await gameService.addPlayerToGame(game.id, p1);
            game = await gameService.addPlayerToGame(game.id, p2);

            // Make random moves until game ends
            console.log(`   ${game.name}(status: ${game.status}) - Players added. Starting playing...`);
            while (game.status === "active") {
                const currentPlayerId = game.currentPlayerId!;
                const current = currentPlayerId === p1.id ? p1.name : p2.name;
                let row: number, col: number;
                do {
                    row = Math.floor(Math.random() * game.board.length);
                    col = Math.floor(Math.random() * game.board.length);
                } while (game.board[row][col] !== null);
                game = await gameService.makeMove(game.id, currentPlayerId, row, col);
                // console.log(`   ${game.name} - Player ${current} made move at (${row},${col})`);
            }

            const winner = await playerModel.getPlayerById(game.winnerId || "");
            console.log(`Game ${game.name} finished: ${game.result.toUpperCase()}${winner ? ` (winner=${winner.name})` : ""}. Total moves: ${game.moves.length}`);

            this.results.completedGames += 1;

        } catch (error) {
            console.error(`     Game ${gameNumber} failed:`, error);
            this.results.failedGames += 1;
            this.results.errors.push(`Game ${gameNumber}: ${(error as Error).message}`);
        }
    }

    private async createGame(name?: string) {
        return gameService.createGame(name);
    }   

    private async updateLeaderBoardStats() {
        console.log("\nUpdating leaderboard...");
        
        this.results.playerStats = await playerModel.getAllPlayerStats() as PlayerInfo[];
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
