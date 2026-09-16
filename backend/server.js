const http = require("http");
const { handleBoardRoutes } = require("./routes/boardRoutes");
const { handleEventRoutes } = require("./routes/eventRoutes");
const { handleTaskRoutes } = require("./routes/taskRoutes");
const { EventService } = require("./services/eventService");
const { PresenceService } = require("./services/presenceService");
const { TaskService } = require("./services/taskService");
const { sendJson } = require("./utils/http");

const port = process.env.PORT || 3000;
const taskService = new TaskService();
const eventService = new EventService();
const presenceService = new PresenceService();

const server = http.createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_ORIGIN || "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host}`);
  request.url = url.pathname;

  if (handleEventRoutes(request, response, eventService, presenceService)) return;
  if (handleBoardRoutes(request, response, taskService)) return;
  if (await handleTaskRoutes(request, response, taskService, eventService)) return;

  if (url.pathname.startsWith("/api/")) {
    sendJson(response, 404, { error: "Route not found" });
    return;
  }

  response.writeHead(404);
  response.end("Use the Vite frontend at http://localhost:5173");
});

server.listen(port, () =>
  console.log(`API listening on http://localhost:${port}`),
);