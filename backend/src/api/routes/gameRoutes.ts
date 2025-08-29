import { Router } from "express";
import { gameService } from "../../container.js";
import { makeGameController } from "../controllers/gameController.js";
import { asyncHandler } from "../middleware/error/asyncHandler.js";

export function gameRoutes() {  
    const router = Router(); 
    const gameController = makeGameController(gameService);   

    // GET /games - list all games
    router.get("/", asyncHandler(gameController.listGames));  

    // POST /games/create - create a new game
    router.post("/create", asyncHandler(gameController.createGame));

    // GET /games/:gameId - get game details
    router.get("/:gameId", asyncHandler(gameController.getGame));

    // POST /games/:gameId/join - add a player to a game
    router.post("/:gameId/join", asyncHandler(gameController.addPlayerToGame));

    // POST /games/:gameId/moves - make a move in a game
    router.post("/:gameId/moves", asyncHandler(gameController.makeMove));

    // DELETE /games/:gameId - delete a game
    router.delete("/:gameId", asyncHandler(gameController.deleteGame));    

    return router;
}