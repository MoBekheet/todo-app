import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { debounceTime, delay, switchMap } from 'rxjs/operators';
import { SortColumn, SortDirection } from '@directives/sortable.directive';
import { Task } from '@models/task.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environment/environment.development';
import Swal from 'sweetalert2';

// Interface to represent the structure of the search result
interface SearchResult {
  tasks: Task[];
  total: number;
}

// Interface to represent the state of the TasksService
interface State {
  page: number;
  pageSize: number;
  searchTerm: string;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
}

@Injectable()
export class TasksService {
  // Observable to track loading state
  private _loading$ = new BehaviorSubject<boolean>(false);

  // Observable to store the tasks currently displayed in the UI
  private _tasks$ = new BehaviorSubject<Task[]>([]);

  // Observable to store all tasks fetched initially
  private _allTasks$ = new BehaviorSubject<Task[]>([]); // Initial fetched data

  // Observable to store the total count of tasks
  private _total$ = new BehaviorSubject<number>(0);

  // Initial state of the TasksService
  private _state: State = {
    page: 1,
    pageSize: 5,
    searchTerm: '',
    sortColumn: 'startDate',
    sortDirection: '',
  };

  // Base API URL
  private apiUrl = environment.apiUrl;

  // HTTP Client for making API requests
  private http = inject(HttpClient);

  //#region Common functions
  // Function to compare two values for sorting
  compare(v1: any, v2: any): number {
    if (typeof v1 === 'string' && typeof v2 === 'string') {
      return v1.localeCompare(v2);
    } else if (typeof v1 === 'number' && typeof v2 === 'number') {
      return v1 - v2;
    } else if (v1 instanceof Date && v2 instanceof Date) {
      return v1.getTime() - v2.getTime();
    } else {
      // If the type is not recognized, they are treated as string
      return String(v1).localeCompare(String(v2));
    }
  }

  // Function to sort tasks based on specified column and direction
  sort(tasks: Task[], column: SortColumn, direction: string): Task[] {
    if (direction === '' || column === '') {
      return tasks;
    } else {
      return [...tasks].sort((a, b) => {
        const res = this.compare(a[column], b[column]);
        return direction === 'asc' ? res : -res;
      });
    }
  }

  // Function to check if a task matches the search term
  matches(task: Task, term: string) {
    return task.taskName.toLowerCase().includes(term.toLowerCase());
  }

  //#endregion Common functions

  //#region Accessor property port

  //#region Getter port
  // Observable to get the currently displayed tasks
  get tasks$() {
    return this._tasks$.asObservable();
  }

  // Observable to get the total count of tasks
  get total$() {
    return this._total$.asObservable();
  }

  // Observable to get the loading state
  get loading$() {
    return this._loading$.asObservable();
  }

  // Get the current page number
  get page() {
    return this._state.page;
  }

  // Get the page size
  get pageSize() {
    return this._state.pageSize;
  }

  // Get the current search term
  get searchTerm() {
    return this._state.searchTerm;
  }

  //#endregion Getter property

  //#region Setter port
  // Get the current search term
  set page(page: number) {
    this.setState({ page });
  }

  // Setter for updating the page size
  set pageSize(pageSize: number) {
    this.setState({ pageSize });
  }

  // Setter for updating the search term
  set searchTerm(searchTerm: string) {
    this.setState({ searchTerm: searchTerm.trim() });
  }

  // Setter for updating the sort type
  setSortType(sortDirection: SortDirection, sortColumn: SortColumn) {
    this.setState({ sortDirection, sortColumn });
  }

  // Function to update the state with the provided patch
  private setState(patch: Partial<State>) {
    Object.assign(this._state, patch);
    this.search();
  }

  //#endregion Setter property

  //#endregion Accessor property

  //#region search port
  // Function to fetch tasks from the fake API
  bindTasks(): Observable<{ data: Task[] }> {
    return this.http.get<{ data: Task[] }>(`${this.apiUrl}tasks.json`);
  }

  // Function to fetch all tasks initially and trigger a search
  getTasks() {
    this.bindTasks().subscribe({
      next: response => {
        {
          // Store all tasks and trigger a search
          this._allTasks$.next(response.data);
          this.search();
        }
      },
      error: err => {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Something went wrong!',
        });
      },
    });
  }

  // Function to trigger a search based on the current state
  search() {
    const { sortColumn, sortDirection, pageSize, page, searchTerm } = this._state;
    this._loading$.next(true);

    // Create a subscription to handle the search process
    const subscription: Subscription = this._allTasks$
      .pipe(
        debounceTime(200),
        switchMap(response => {
          // Sort the tasks
          let tasks = this.sort(response, sortColumn, sortDirection);

          // Filter tasks based on search term
          if (searchTerm) {
            tasks = tasks.filter(task => this.matches(task, searchTerm));
          }

          // Calculate total count
          const total = tasks.length;

          // Paginate tasks
          tasks = tasks.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

          return of({ tasks, total });
        }),
        delay(200)
      )
      .subscribe({
        next: (result: SearchResult) => {
          // Update the displayed tasks and total count
          this._tasks$.next(result.tasks);
          this._total$.next(result.total);
          this._loading$.next(false);

          // Unsubscribe to avoid memory leaks
          subscription.unsubscribe();
        },
        error: err => {
          // Show an error message if something goes wrong
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Something went wrong!',
          });
          this._loading$.next(false);
        },
      });
  }

  // Function to delete a task after confirming with a dialog
  deleteTask({ id }: Task): void {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then(result => {
      if (result.isConfirmed) {
        // Remove the task from _allTasks$
        const allTasks = this._allTasks$.value.filter(task => task.id !== id);
        this._allTasks$.next(allTasks);

        // Trigger a search to update displayed tasks and total count
        this.search();

        // Show a success message after deletion
        Swal.fire('Deleted!', 'Your task has been deleted.', 'success');
      }
    });
  }

  // Function to update the status of a task
  updateTaskStatus({ id, status }: Task): void {
    // Find the task in _allTasks$ by ID
    const allTasks = this._allTasks$.value;
    const updatedTasks = allTasks.map(task => {
      if (task.id === id) {
        // Update the status of the matching task
        return { ...task, status };
      }
      return task;
    });

    // Update _allTasks$ with the modified tasks
    this._allTasks$.next(updatedTasks);

    // Trigger a search to update displayed tasks and total count
    this.search();

    // Show a success message
    Swal.fire('Status Updated!', 'Task status has been updated.', 'success');
  }

  //#endregion search port
}
