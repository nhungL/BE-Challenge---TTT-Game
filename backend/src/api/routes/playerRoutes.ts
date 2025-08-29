import { Router } from "express";
import { playerModel, gameService } from "../../container.js";
import { makePlayerController } from "../controllers/playerController.js";
import { asyncHandler } from "../middleware/error/asyncHandler.js";

export function playerRoutes() {  
    const router = Router(); 
    const playerController = makePlayerController({gameService, playerModel});  

    // GET /players - list all players
    router.get("/", asyncHandler(playerController.listPlayers));

    // POST /players/create - create a new player
    router.post("/create", asyncHandler(playerController.createPlayer));

    // GET /players/allstats - get all player stats
    router.get("/allstats", asyncHandler(playerController.getAllPlayerStats));

    // GET /players/:playerId - get player details
    router.get("/:playerId", asyncHandler(playerController.getPlayer));

    return router;
}