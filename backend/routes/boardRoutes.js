import express from "express";

function boardRoutes(taskService) {
  const router = express.Router();

  router.get("/", (req, res) => {
    res.json(taskService.list());
  });

  return router;
}

export { boardRoutes };