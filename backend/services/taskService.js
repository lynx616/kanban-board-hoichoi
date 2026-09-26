import crypto from "crypto";
import { z } from "zod";
import { columns, priorities, issueTypes, editableFields } from "../constants/board.js";
import { taskExamples } from "../constants/examples.js";

const createTaskSchema = z.object({
  title: z.string().min(1, "A title is required").max(120, "Title must be 120 characters or fewer"),
  description: z.string().optional(),
  priority: z.enum(priorities).default("medium"),
  assignee: z.string().default("Unassigned"),
  status: z.enum(columns).default("backlog"),
  type: z.enum(issueTypes).default("task"),
}).strict();

const updateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(120, "Title must be 120 characters or fewer").optional(),
  description: z.string().optional(),
  priority: z.enum(priorities).optional(),
  assignee: z.string().optional(),
  status: z.enum(columns).optional(),
  type: z.enum(issueTypes).optional(),
  position: z.number().int().min(0).optional(),
}).strict();

export class TaskService {
  constructor() {
    this.tasks = new Map(
      taskExamples.map((task) => [
        task.id,
        { ...task, updatedAt: new Date().toISOString() },
      ]),
    );
  }

  list() {
    return [...this.tasks.values()].sort(
      (first, second) =>
        first.status.localeCompare(second.status) ||
        first.position - second.position,
    );
  }

  get(id) {
    return this.tasks.get(id);
  }

  create(input) {
    const parsed = createTaskSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.errors[0].message);
    }
    const data = parsed.data;

    const status = columns.includes(data.status) ? data.status : "backlog";
    const type = issueTypes.includes(data.type) ? data.type : "task";
    const task = {
      id: crypto.randomUUID(),
      title: data.title.trim(),
      description: data.description || "",
      priority: priorities.includes(data.priority) ? data.priority : "medium",
      assignee: data.assignee || "Unassigned",
      status,
      type,
      position: this.countByStatus(status),
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  update(id, input) {
    const task = this.get(id);
    if (!task) return null;

    const parsed = updateTaskSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.errors[0].message);
    }
    const data = parsed.data;

    const previousStatus = task.status;
    const nextStatus = data.status !== undefined ? data.status : task.status;
    const hasPosition = data.position !== undefined;
    Object.assign(
      task,
      Object.fromEntries(
        Object.entries(data).filter(
          ([key]) => editableFields.includes(key) && key !== "status" && key !== "position",
        ),
      ),
    );
    task.updatedAt = new Date().toISOString();
    if (nextStatus !== previousStatus || hasPosition) {
      this.place(task, nextStatus, hasPosition ? data.position : Number.MAX_SAFE_INTEGER);
      if (previousStatus !== nextStatus) this.normalize(previousStatus);
    }
    return task;
  }

  remove(id) {
    const task = this.get(id);
    if (!task) return null;
    this.tasks.delete(id);
    this.normalize(task.status);
    return task;
  }

  countByStatus(status) {
    return [...this.tasks.values()].filter((task) => task.status === status).length;
  }

  place(task, status, position) {
    const others = [...this.tasks.values()]
      .filter((item) => item.id !== task.id && item.status === status)
      .sort((first, second) => first.position - second.position);
    others.splice(Math.max(0, Math.min(position, others.length)), 0, task);
    task.status = status;
    others.forEach((item, index) => {
      item.position = index;
    });
  }

  normalize(status) {
    [...this.tasks.values()]
      .filter((task) => task.status === status)
      .sort((first, second) => first.position - second.position)
      .forEach((task, index) => {
        task.position = index;
      });
  }
}