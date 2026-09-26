import express from "express";
import { TaskService } from "../services/taskService.js";
import { EventService } from "../services/eventService.js";

function taskRoutes(taskService, eventService) {
  const router = express.Router();

  router.post("/", async (req, res) => {
    try {
      const task = taskService.create(req.body);
      eventService.send("task-created", task);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const task = taskService.update(req.params.id, req.body);
      if (!task) return res.status(404).json({ error: "Task not found" });
      eventService.send("task-updated", task);
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete("/:id", async (req, res) => {
    const task = taskService.remove(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    eventService.send("task-deleted", task);
    res.json({ id: task.id });
  });

  return router;
}

export { taskRoutes };