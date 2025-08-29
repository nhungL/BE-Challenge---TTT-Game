// api/controllers/gameController.ts
import type { Request, Response } from "express";
import type { GameService } from "../../services/gameService.js";

export const makeGameController = (gameService: GameService) => ({
    createGame: async (req: Request, res: Response) => {
        const { name } = req.body;
        console.log(`\nCreating new game ${name || ''} ...`);
        try {
            const game = await gameService.createGame(name);
            res.status(201).json(game);
            console.log(`   ${name || ''} created with ID: ${game.id}`);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    getGame: async (req: Request, res: Response) => {
        const { gameId } = req.params;
        if (!gameId) {
            return res.status(400).json({ error: "Game ID is required" });
        }
        try {
            const game = await gameService.getGameById(gameId);
            if (!game) {
                return res.status(404).json({ error: "Game not found" });
            }
            res.status(200).json(game);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    listGames: async (_req: Request, res: Response) => {
        try {
            const games = await gameService.getAllGames();
            res.status(200).json(games);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    addPlayerToGame: async (req: Request, res: Response) => {
        const { gameId } = req.params;
        const { player } = req.body;
        if (player && gameId) console.log(`Adding player ${player.name} to game ${gameId}...`);
        if (!gameId) {
            return res.status(400).json({ error: "Game ID is required" });
        }
        if (!player) {
            return res.status(400).json({ error: "Player not found" });
        }
        try {
            const game = await gameService.addPlayerToGame(gameId, player);
            res.status(200).json(game);
            console.log(`   gameController: Player ${player.name} added to game ${game.name}`);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    makeMove: async (req: Request, res: Response) => {
        const { gameId } = req.params;
        const { playerId, row, col } = req.body;
        if (!gameId) {
            return res.status(400).json({ error: "Game ID is required" });
        }
        if (!playerId || row === undefined || col === undefined) {
            return res.status(400).json({ error: "Player ID, row, and column are required" });
        }
        try {
            const game = await gameService.makeMove(gameId, playerId, row, col);
            const move = game.moves;
            res.status(200).json({game, move});
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    deleteGame: async (req: Request, res: Response) => {
        const { gameId } = req.params;
        if (!gameId) {
            return res.status(400).json({ error: "Game ID is required" });
        }
        try {
            await gameService.deleteGame(gameId);
            res.status(204).end();
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

});