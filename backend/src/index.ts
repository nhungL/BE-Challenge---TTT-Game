import express from 'express';
import { gameRoutes } from "./api/routes/gameRoutes.js";
import { playerRoutes } from './api/routes/playerRoutes.js';
import { errorHandler } from "./api/middleware/error/errorHandler.js";
import { notFound } from "./api/middleware/error/errorHandler.js";

const app = express();
app.use(express.json());

app.get("/", (_req, res) => res.send("Connected to backend!"));
app.use("/games", gameRoutes());
app.use("/players", playerRoutes());

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

export const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;