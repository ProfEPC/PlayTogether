import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./socket/registerHandlers";
import { logger } from "./utils/logger";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  logger.serverStarted(PORT);
});
