export interface Task {
  id: number;
  taskName: string;
  startDate: Date;
  days: number;
  dueDate: Date;
  items: string[];
  status: string;
  description?: string;
}
