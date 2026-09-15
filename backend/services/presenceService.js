class PresenceService {
  constructor() {
    this.users = new Map();
  }

  makeInitials(name) {
    return String(name || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  prune() {
    const now = Date.now();
    for (const [key, user] of this.users.entries()) {
      if (now - user.seenAt > 30000) {
        this.users.delete(key);
      }
    }
  }

  upsert(id, name) {
    const cleanId = String(id || "").trim();
    const cleanName = String(name || "").trim();
    if (!cleanId || !cleanName) return this.list();

    this.users.set(cleanId, {
      id: cleanId,
      name: cleanName,
      initials: this.makeInitials(cleanName),
      seenAt: Date.now(),
    });

    return this.list();
  }

  remove(id) {
    const cleanId = String(id || "").trim();
    if (!cleanId) return this.list();
    this.users.delete(cleanId);
    return this.list();
  }

  list() {
    this.prune();
    return [...this.users.values()].sort((first, second) =>
      first.name.localeCompare(second.name),
    );
  }
}

module.exports = { PresenceService };
