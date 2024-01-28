import { Component, inject, OnInit, QueryList, TemplateRef, ViewChildren } from '@angular/core';
import { Task } from '@models/task.model';
import { TasksService } from '@services/tasks.service';
import { SortableHeader, SortEvent } from '@directives/sortable.directive';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbDropdownModule, NgbHighlight, NgbInputDatepicker, NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    FormsModule,
    NgbHighlight,
    SortableHeader,
    NgbPaginationModule,
    DatePipe,
    NgbDropdownModule,
    NgbInputDatepicker,
    ReactiveFormsModule,
  ],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss',
  providers: [TasksService, DecimalPipe],
})
export class TasksComponent implements OnInit {
  // Observable to track the currently displayed tasks in the UI
  tasks$: Observable<Task[]>;

  // Observable to store the total count of tasks
  total$: Observable<number>;

  // Form group to handle changing task status
  changeStatusForm: FormGroup;

  // Instance of TasksService for managing tasks-related functionality
  tasksService = inject(TasksService);

  // Instance of FormBuilder for creating and managing forms
  formBuilder = inject(FormBuilder);

  // Instance of NgbModal for handling modal dialogs
  private modalService = inject(NgbModal);

  // QueryList to manage the sortable headers in the UI
  @ViewChildren(SortableHeader) headers: QueryList<SortableHeader>;

  ngOnInit(): void {
    // Subscribe to tasks$ and total$ observables from TasksService
    this.tasks$ = this.tasksService.tasks$;
    this.total$ = this.tasksService.total$;

    // Fetch initial tasks data from the fake server
    this.tasksService.getTasks();
  }

  //#region Common functions

  // Function to initialize the change status form
  initChangeStatusForm() {
    this.changeStatusForm = this.formBuilder.group({
      id: [null, Validators.required],
      taskName: '',
      status: ['', Validators.required],
    });
  }

  // Function to open the change status modal and populate the form with task details
  openModal(content: TemplateRef<any>, { id, taskName, status }: Task) {
    this.initChangeStatusForm();
    this.changeStatusForm.patchValue({ id, taskName, status });
    this.modalService.open(content);
  }

  //#endregion Common functions

  //#region Sort port

  // Event handler for sorting triggered by the SortableHeader component
  onSort({ column, direction }: SortEvent) {
    this.resetSort(column);
    this.tasksService.setSortType(direction, column);
  }

  // Function to reset the sorting state for all sortable headers
  resetSort(column = '') {
    this.headers.forEach((header: SortableHeader) => {
      if (header.sortable !== column) {
        header.direction = '';
        const getChildren = header.elementRef.nativeElement?.children[0] as HTMLElement;
        if (getChildren?.matches('i')) getChildren.className = '';
      }
    });
  }

  //#endregion Sort port

  //#region Search port

  // Function to trigger a search based on the provided taskName
  search(taskName: string) {
    this.tasksService.searchTerm = taskName;
  }

  // Function to reset the search and sorting state
  resetSearch(form: FormGroup) {
    this.resetSort();
    // Default sort order by starting date
    this.tasksService.setSortType('asc', 'startDate');
    form.get('taskName')?.reset('');
    this.search('');
  }

  //#endregion Search port

  //#region Actions port

  viewTask(task: Task) {
    // Implement the logic for viewing a task
    console.log({ task });
  }

  editTask(task: Task) {
    // Implement the logic for editing a task
    console.log({ task });
  }

  // Calls the deleteTask method in TasksService to delete a task
  deleteTask(task: Task) {
    this.tasksService.deleteTask(task);
  }

  // Updates the task status
  updateTaskStatus() {
    if (this.changeStatusForm.valid) {
      this.modalService.dismissAll('Save click');
      this.tasksService.updateTaskStatus(this.changeStatusForm?.value);
      this.initChangeStatusForm();
    }
  }

  //#endregion Actions port
}
