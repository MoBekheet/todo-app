import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'tasks',
    title: 'Tasks',
    loadComponent: () => import('./pages/tasks/tasks.component').then(m => m.TasksComponent),
  },
  {
    path: 'create-task',
    title: 'Create Task',
    loadComponent: () => import('./pages/create-task/create-task.component').then(m => m.CreateTaskComponent),
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/page-not-found/page-not-found.component').then(m => m.PageNotFoundComponent),
  },
];
