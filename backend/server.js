import express from "express";
import cors from "cors";
import { taskRoutes } from "./routes/taskRoutes.js";
import { boardRoutes } from "./routes/boardRoutes.js";
import { eventRoutes, presenceRouter } from "./routes/eventRoutes.js";
import { EventService } from "./services/eventService.js";
import { PresenceService } from "./services/presenceService.js";
import { TaskService } from "./services/taskService.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "*" }));
app.use(express.json({ limit: "1mb" }));

const taskService = new TaskService();
const eventService = new EventService();
const presenceService = new PresenceService();

app.use("/api/tasks", taskRoutes(taskService, eventService));
app.use("/api/board", boardRoutes(taskService));
app.use("/api/events", eventRoutes(eventService, presenceService));
app.use("/api/presence", presenceRouter(presenceService, eventService));

app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});