import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Task } from '../models/task.model';
import { environment } from '@environment/environment.development';

@Injectable({
  providedIn: 'root',
})
export class CreateTaskService {
  private apiUrl = environment.apiUrl;
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$ = this.tasksSubject.asObservable();

  addTask(task: Task): void {
    // Implement logic to add a new task
    const currentTasks = this.tasksSubject.value;
    this.tasksSubject.next([...currentTasks, task]);
  }

  updateTask(updatedTask: Task): void {
    // Implement logic to update a task
    const currentTasks = this.tasksSubject.value;
    const index = currentTasks.findIndex(task => task.id === updatedTask.id);

    if (index !== -1) {
      currentTasks[index] = updatedTask;
      this.tasksSubject.next([...currentTasks]);
    }
  }

  deleteTask(taskId: number): void {
    // Implement logic to delete a task
    const currentTasks = this.tasksSubject.value;
    const updatedTasks = currentTasks.filter(task => task.id !== taskId);
    this.tasksSubject.next(updatedTasks);
  }
}
