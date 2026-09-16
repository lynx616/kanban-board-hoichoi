import { Archive, BadgeCheck, ListTodo, Sun } from "lucide-react";

export const issueTypes = ["defect", "task", "story"];

export const columns = [
  { id: "backlog", label: "Backlog", color: "tone-slate", icon: Archive },
  { id: "todo", label: "Todo", color: "tone-yellow", icon: ListTodo },
  { id: "in-progress", label: "In progress", color: "tone-coral", icon: Sun },
  { id: "done", label: "Done", color: "tone-blue", icon: BadgeCheck },
];
