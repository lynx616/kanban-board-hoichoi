const columns = ["backlog", "todo", "in-progress", "done"];
const priorities = ["low", "medium", "high"];
const issueTypes = ["defect", "task", "story"];
const editableFields = [
  "title",
  "description",
  "priority",
  "assignee",
  "status",
  "position",
  "type",
];

module.exports = { columns, priorities, issueTypes, editableFields };
