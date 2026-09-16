export function sortTasks(items) {
  return [...items].sort(
    (a, b) => a.status.localeCompare(b.status) || a.position - b.position,
  );
}

export function applyEvent(list, event, local) {
  const task = event.task;
  if (local?.deleted || event.type === "task-deleted") {
    return list.filter((item) => item.id !== task.id);
  }
  const baseline = local || list.find((item) => item.id === task.id);
  if (baseline && new Date(baseline.updatedAt) >= new Date(task.updatedAt)) {
    return list;
  }
  return [...list.filter((item) => item.id !== task.id), task];
}

export function rollbackTasks(snapshot, ids) {
  const previous = new Map(
    snapshot.filter((task) => ids.includes(task.id)).map((task) => [task.id, task]),
  );
  return (current) =>
    sortTasks([
      ...current.filter((task) => !ids.includes(task.id)),
      ...ids.map((id) => previous.get(id)).filter(Boolean),
    ]);
}
