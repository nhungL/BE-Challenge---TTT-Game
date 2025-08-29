// api/controllers/playerController.ts
// Controller for player-related endpoints
import type { Request, Response } from "express";
import type { GameService } from "../../services/gameService.js";
import type { PlayerModel } from "../../models/playerModel.js";

export const makePlayerController = (
    {gameService, playerModel}: {gameService: GameService; playerModel: PlayerModel}
) => ({

    listPlayers: async (_req: Request, res: Response) => {
        try {
            const players = await playerModel.getAllPlayers();
            res.status(200).json(players);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    createPlayer: async (req: Request, res: Response) => {
        const { name, email } = req.body;
        if (!name || !email) {
            return res.status(400).json({ error: "Name and email are required" });
        }
        if (name.trim().length > 30) {
            return res.status(400).json({ error: "Name is too long" });
        }
        if (email.trim().length > 50) {
            return res.status(400).json({ error: "Email is too long" });
        }
        try {
            const player = await playerModel.createPlayer(name, email);
            res.status(201).json(player);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    getPlayer: async (req: Request, res: Response) => {
        const { playerId } = req.params;
        if (!playerId) {
            return res.status(400).json({ error: "Player ID is required" });
        }
        try {
            const player = await playerModel.getPlayerById(playerId);
            if (!player) {
                return res.status(404).json({ error: "Player not found" });
            }
            res.status(200).json(player);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    getAllPlayerStats: async (_req: Request, res: Response) => {
        try {
            const stats = await playerModel.getAllPlayerStats();
            res.status(200).json(stats);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },  
});