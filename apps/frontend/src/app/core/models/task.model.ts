export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  userId: string;
}

// Interface for creating/updating tasks (without id/createdAt/userId managed by backend)
export interface TaskData {
    title: string;
    description: string;
    completed?: boolean;
}