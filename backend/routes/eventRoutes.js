const { sendJson, readJson } = require("../utils/http");

function handleEventRoutes(request, response, eventService, presenceService) {
  if (request.url === "/api/presence") {
    if (request.method === "GET") {
      sendJson(response, 200, presenceService.list());
      return true;
    }

    if (request.method === "POST" || request.method === "DELETE") {
      return handlePresenceMutation(request, response, eventService, presenceService);
    }
  }

  if (request.url !== "/api/events" || request.method !== "GET") return false;
  response.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  response.write(": connected\n\n");
  eventService.addClient(response);
  return true;
}

async function handlePresenceMutation(request, response, eventService, presenceService) {
  try {
    const body = await readJson(request);
    const id = String(body?.id || "").trim();
    const name = String(body?.name || "").trim();

    if (!id) {
      sendJson(response, 200, presenceService.list());
      return true;
    }

    if (request.method === "POST") {
      const nextUsers = presenceService.upsert(id, name);
      eventService.send("presence-updated", nextUsers);
      sendJson(response, 200, nextUsers);
      return true;
    }

    const nextUsers = presenceService.remove(id);
    eventService.send("presence-updated", nextUsers);
    sendJson(response, 200, nextUsers);
    return true;
  } catch (error) {
    sendJson(response, 400, { error: error.message });
    return true;
  }
}

module.exports = { handleEventRoutes };
