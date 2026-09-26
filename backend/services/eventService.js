export class EventService {
  constructor() {
    this.clients = new Set();
  }

  addClient(response) {
    this.clients.add(response);
    const drop = () => this.clients.delete(response);
    response.on("close", drop);
    response.on("error", drop);
  }

  removeClient(response) {
    this.clients.delete(response);
  }

  send(event, payload) {
    if (!this.clients.size) return;
    const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    // Iterate a copy: a dead client must never abort delivery to the others.
    for (const client of [...this.clients]) {
      try {
        if (client.writableEnded || client.destroyed) {
          this.clients.delete(client);
          continue;
        }
        client.write(message);
      } catch {
        this.clients.delete(client);
      }
    }
  }
}