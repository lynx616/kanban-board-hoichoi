import express from "express";
import { PresenceService } from "../services/presenceService.js";
import { EventService } from "../services/eventService.js";

function eventRoutes(eventService, presenceService) {
  const router = express.Router();

  // SSE endpoint for real-time events
  router.get("/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    res.write(": connected\n\n");
    eventService.addClient(res);
    req.on("close", () => eventService.removeClient(res));
  });

  return router;
}

function presenceRouter(presenceService, eventService) {
  const router = express.Router();

  router.get("/", (req, res) => {
    res.json(presenceService.list());
  });

  router.post("/", async (req, res) => {
    try {
      const { id, name } = req.body;
      if (!id) return res.json(presenceService.list());
      const nextUsers = presenceService.upsert(String(id).trim(), String(name || "").trim());
      eventService.send("presence-updated", nextUsers);
      res.json(nextUsers);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete("/", async (req, res) => {
    try {
      const { id } = req.body;
      const idStr = String(id || "").trim();
      if (!idStr) return res.json(presenceService.list());
      const nextUsers = presenceService.remove(idStr);
      eventService.send("presence-updated", nextUsers);
      res.json(nextUsers);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

export { eventRoutes, presenceRouter };