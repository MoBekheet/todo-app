import { Component, ElementRef, inject, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbDateStruct, NgbInputDatepicker } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule, DatePipe } from '@angular/common';
import { Subscription, take } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-task',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbInputDatepicker],
  providers: [DatePipe],
  templateUrl: './create-task.component.html',
  styleUrl: './create-task.component.scss',
})
export class CreateTaskComponent implements OnInit {
  // Form group to manage the new task creation form
  newTaskForm: FormGroup;

  // Flag to track whether the form has been submitted
  isSubmitted: boolean = false;

  // Minimum start date for the task (used in date validation)
  minStartDate: NgbDateStruct;

  // Object to store and display the form submission result
  showResult: object;

  // Instance of the FormBuilder service for creating and managing forms
  private formBuilder = inject(FormBuilder);

  // Instance of the DatePipe service for formatting dates
  private datePipe = inject(DatePipe);

  // QueryList to track multiple elements with the reference 'itemNameRef'
  @ViewChildren('itemNameRef') itemNameRef: QueryList<ElementRef>;

  ngOnInit(): void {
    // Initialize the new task form.
    this.initNewTaskForm();
  }

  // region Form Initialization

  // Function to initialize the new task form.
  initNewTaskForm() {
    // Create the new task form.
    this.newTaskForm = this.formBuilder.group({
      taskName: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      startDate: ['', Validators.required],
      duration: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      dueDate: [{ value: '', disabled: true }],
      items: this.formBuilder.array(
        [
          this.formBuilder.group({
            id: [1, Validators.required],
            name: ['', Validators.required],
          }),
        ],
        { validators: [Validators.required] }
      ),
      status: 'new',
      description: ['', [Validators.minLength(20), Validators.maxLength(500)]],
    });

    // Set the minimum start date to the current date.
    const date = new Date();
    this.minStartDate = { day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear() };
  }

  // endregion Form Initialization

  // region Due Date Update

  // updateDueDate updates the due date based on the start date and task duration.
  updateDueDate(): void {
    // Extract duration and start date from the form.
    const duration = this.newTaskForm.get('duration')?.value as number;
    const startDate = this.getDateWithFormat(this.newTaskForm.get('startDate')?.value);

    // Check if the start date and duration are valid.
    if (startDate && !isNaN(new Date(startDate).getTime()) && duration > 0) {
      // Calculate due date and update the form control.
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + duration);
      this.newTaskForm.get('dueDate')?.setValue(this.datePipe.transform(dueDate, 'yyyy-MM-dd'));
    } else {
      // Invalid start date or duration, clear due date.
      this.newTaskForm.get('dueDate')?.reset('');
    }
  }

  // Function to formats a NgbDateStruct into a string date.
  getDateWithFormat(date: NgbDateStruct): string | null {
    return this.datePipe.transform(new Date(date.year, date.month - 1, date.day), 'yyyy-MM-dd');
  }

  // endregion Due Date Update

  // region Items Management

  // items getter returns the FormArray for the 'items'.
  get items(): FormArray {
    return this.newTaskForm.get('items') as FormArray;
  }

  // addItem adds a new item to the task.
  addItem(isValid: boolean): void {
    // Check if the form is valid before adding a new item.
    if (isValid) {
      // Added debounceTime to resolve the ExpressionChangedAfterItHasBeenCheckedError issue.
      const subscription: Subscription = this.itemNameRef?.changes?.pipe(debounceTime(0), take(1)).subscribe(changes => {
        // Focus on the last added item.
        changes.last.nativeElement.focus();
        subscription?.unsubscribe();
      });

      // Determine the ID for the new item.
      const lastId = this.items.at(-1)?.get('id')?.value || 0;

      // Add a new item to the 'items' FormArray.
      this.items.push(
        this.formBuilder.group({
          id: [lastId + 1, Validators.required],
          name: ['', Validators.required],
        })
      );
    }
  }

  // removeItem removes an item from the task.
  removeItem(index: number): void {
    // Remove the item at the specified index.
    this.items.removeAt(index);

    // Update the IDs of the remaining items.
    this.items.controls?.map((control, index) => control.get('id')?.setValue(index + 1));

    // Show a warning if there are no items remaining and add a new item.
    if (this.items.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'At least one item is required in a task.',
      });

      // Add a new item.
      this.addItem(true);
    }
  }

  // endregion Items Management

  // region Form Submission

  // onSubmit handles the form submission, updating and displaying the result.
  onSubmit(): void {
    this.isSubmitted = true;
    if (this.newTaskForm.valid) {
      this.newTaskForm.get('startDate')?.setValue(this.getDateWithFormat(this.newTaskForm.get('startDate')?.value));
      this.showResult = this.newTaskForm.getRawValue();
      this.isSubmitted = false;
      this.initNewTaskForm();
    }
  }

  // endregion Form Submission
}
