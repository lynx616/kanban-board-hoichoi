import express from "express";

function eventRoutes(eventService) {
  const router = express.Router();

  // Mounted at /api/events, so this resolves to GET /api/events
  router.get("/", (req, res) => {
    res.status(200).set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Stop nginx and other proxies from buffering the stream
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();
    res.write("retry: 3000\n\n");
    res.write(": connected\n\n");

    eventService.addClient(res);

    // Comment frames keep the connection alive through mobile/wifi proxies
    // that would otherwise drop an idle stream.
    const heartbeat = setInterval(() => {
      res.write(": ping\n\n");
    }, 25000);

    const cleanup = () => {
      clearInterval(heartbeat);
      eventService.removeClient(res);
    };
    req.on("close", cleanup);
    res.on("close", cleanup);
    res.on("error", cleanup);
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