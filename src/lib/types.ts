export type TodoStatus = "open" | "in_progress" | "completed";
export type TodoPriority = "low" | "medium" | "high";

export type Todo = {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  status: TodoStatus;
  priority: TodoPriority;
  category: string | null;
  completedAt: string | null;
  archivedAt: string | null;
};

export type TodoRow = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  status: TodoStatus;
  priority: TodoPriority;
  category: string | null;
  completed_at: string | null;
  archived_at: string | null;
};
