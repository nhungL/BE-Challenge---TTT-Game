import { GameModel } from "./models/gameModel.js";
import { PlayerModel } from "./models/playerModel.js";
import { GameService } from "./services/gameService.js";

export const playerModel = new PlayerModel();
export const gameModel   = new GameModel();
export const gameService = new GameService(gameModel, playerModel);