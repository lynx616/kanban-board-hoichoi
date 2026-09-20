import { useEffect, useMemo, useRef, useState } from "react";
import { MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { API_BASE_URL, request } from "../api/client";
import { columns } from "../constants/board";
import { applyEvent, rollbackTasks, sortTasks } from "../utils/tasks";

export function useBoard() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState(params.get("search") || "");
  const [priority, setPriority] = useState(params.get("priority") || "");
  const [assignee, setAssignee] = useState(params.get("assignee") || "");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [connectionState, setConnectionState] = useState("connecting");
  const pending = useRef(new Set());
  const deferredEvents = useRef(new Map());
  const tasksRef = useRef([]);
  tasksRef.current = tasks;
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 3 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  };
  const releasePending = (ids, localResults = new Map()) => {
    ids.forEach((id) => pending.current.delete(id));
    const queued = ids
      .map((id) => [id, deferredEvents.current.get(id)])
      .filter(([, event]) => event);
    queued.forEach(([id]) => deferredEvents.current.delete(id));
    if (!queued.length) return;
    setTasks((current) =>
      sortTasks(
        queued.reduce(
          (next, [id, event]) => applyEvent(next, event, localResults.get(id)),
          current,
        ),
      ),
    );
  };
  const mergeBoard = (current, board) =>
    sortTasks(
      board.flatMap((task) => {
        if (!pending.current.has(task.id)) return [task];
        const local = current.find((item) => item.id === task.id);
        return local ? [local] : [];
      }),
    );

  useEffect(() => {
    let events;
    let cancelled = false;
    let sawOpen = false;
    const reconcileEvent = (event) => {
      const task = JSON.parse(event.data);
      if (pending.current.has(task.id)) {
        deferredEvents.current.set(task.id, { type: event.type, task });
        return;
      }
      setTasks((current) => sortTasks(applyEvent(current, { type: event.type, task })));
    };
    request("/api/board")
      .then((board) => {
        if (cancelled) return;
        setTasks(board);
        events = new EventSource(`${API_BASE_URL}/api/events`);
        events.onopen = () => {
          setConnectionState("live");
          if (!sawOpen) {
            sawOpen = true;
            return;
          }
          request("/api/board")
            .then((fresh) => {
              if (!cancelled) setTasks((current) => mergeBoard(current, fresh));
            })
            .catch(() => {});
        };
        events.onerror = () => setConnectionState("reconnecting");
        events.addEventListener("task-created", reconcileEvent);
        events.addEventListener("task-updated", reconcileEvent);
        events.addEventListener("task-deleted", reconcileEvent);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    return () => {
      cancelled = true;
      events?.close();
    };
  }, []);

  useEffect(() => {
    const next = new URLSearchParams();
    if (query) next.set("search", query);
    if (priority) next.set("priority", priority);
    if (assignee) next.set("assignee", assignee);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${next.toString() ? `?${next}` : ""}`,
    );
  }, [query, priority, assignee]);

  const assignees = [
    ...new Set(tasks.map((task) => task.assignee).filter(Boolean)),
  ].sort();
  const visible = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(query.toLowerCase()) &&
      (!priority || task.priority === priority) &&
      (!assignee || task.assignee === assignee),
  );

  const saveTask = async (draft, existingId) => {
    const board = tasksRef.current;
    const snapshot = board;
    const currentTask = existingId ? board.find((task) => task.id === existingId) : null;
    const optimistic = {
      ...currentTask,
      ...draft,
      id: existingId || `temp-${Date.now()}`,
      updatedAt: new Date().toISOString(),
      position: currentTask
        ? currentTask.position
        : board.filter((task) => task.status === draft.status).length,
    };
    if (existingId) {
      pending.current.add(existingId);
      setTasks((current) =>
        current.map((task) => (task.id === existingId ? optimistic : task)),
      );
    }
    let committedTask = currentTask || optimistic;
    try {
      const result = await request(
        existingId ? `/api/tasks/${existingId}` : "/api/tasks",
        { method: existingId ? "PATCH" : "POST", body: JSON.stringify(draft) },
      );
      committedTask = result;
      setTasks((current) =>
        sortTasks([
          ...current.filter((task) => task.id !== result.id && task.id !== existingId),
          result,
        ]),
      );
      notify(existingId ? "Task updated" : "Task created");
    } catch (e) {
      if (existingId) setTasks(rollbackTasks(snapshot, [existingId]));
      notify(`Could not save task: ${e.message}`);
    } finally {
      if (existingId) {
        releasePending([existingId], new Map([[existingId, committedTask]]));
      }
    }
  };

  const deleteTask = async (task) => {
    if (!window.confirm(`Delete “${task.title}”?`)) return;
    const snapshot = tasksRef.current;
    pending.current.add(task.id);
    setTasks((current) => current.filter((item) => item.id !== task.id));
    let committed = { deleted: true };
    try {
      await request(`/api/tasks/${task.id}`, { method: "DELETE" });
      notify("Task deleted");
      setModal(null);
    } catch (e) {
      committed = task;
      setTasks(rollbackTasks(snapshot, [task.id]));
      notify(`Could not delete task: ${e.message}`);
    } finally {
      releasePending([task.id], new Map([[task.id, committed]]));
    }
  };

  const moveTask = async (activeId, overId) => {
    const board = tasksRef.current;
    const active = board.find((task) => task.id === activeId);
    if (!active) return;
    const target = columns.some((column) => column.id === overId)
      ? overId
      : board.find((task) => task.id === overId)?.status || active.status;
    const siblings = board
      .filter((task) => task.status === target && task.id !== activeId)
      .sort((a, b) => a.position - b.position);
    const index = columns.some((column) => column.id === overId)
      ? siblings.length
      : Math.max(0, siblings.findIndex((task) => task.id === overId));
    const next = [
      ...siblings.slice(0, index),
      { ...active, status: target },
      ...siblings.slice(index),
    ].map((task, position) => ({ ...task, position }));
    const leftover =
      active.status === target
        ? []
        : board
            .filter((task) => task.status === active.status && task.id !== activeId)
            .sort((a, b) => a.position - b.position)
            .map((task, position) => ({ ...task, position }));
    const affected = [...next, ...leftover].map((task) => task.id);
    const snapshot = board;
    setTasks((current) =>
      sortTasks([
        ...current.filter(
          (task) => task.status !== active.status && task.status !== target,
        ),
        ...next,
        ...leftover,
      ]),
    );
    pending.current.add(activeId);
    let result = active;
    try {
      result = await request(`/api/tasks/${activeId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: target, position: index }),
      });
    } catch (e) {
      setTasks(rollbackTasks(snapshot, affected));
      notify(`Move rolled back: ${e.message}`);
    } finally {
      releasePending([activeId], new Map([[activeId, result]]));
    }
  };

  return {
    assignees,
    assignee,
    connectionState,
    deleteTask,
    error,
    loading,
    modal,
    moveTask,
    priority,
    query,
    saveTask,
    sensors,
    setAssignee,
    setModal,
    setPriority,
    setQuery,
    toast,
    visible,
  };
}
