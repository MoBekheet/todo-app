import { Directive, ElementRef, EventEmitter, inject, Input, Output } from '@angular/core';
import { Task } from '@models/task.model';

export type SortColumn = keyof Task | '';
export type SortDirection = 'asc' | 'desc' | '';
const rotate: { [key: string]: SortDirection } = { asc: 'desc', desc: '', '': 'asc' };

export interface SortEvent {
  column: SortColumn;
  direction: SortDirection;
}

@Directive({
  selector: 'th[sortable]',
  standalone: true,
  host: {
    '[class.asc]': 'direction === "asc"',
    '[class.desc]': 'direction === "desc"',
    '(click)': 'rotate()',
  },
})
export class SortableHeader {
  @Input() sortable: SortColumn = '';
  @Input() direction: SortDirection = '';
  @Output() sort = new EventEmitter<SortEvent>();
  elementRef = inject(ElementRef);

  rotate() {
    this.direction = rotate[this.direction];
    const obj: any = {
      asc: 'bi bi-sort-up', // Ascending
      desc: 'bi bi-sort-down', // Descending
    };
    const getChildren = this.elementRef.nativeElement?.children[0] as HTMLElement;
    if (getChildren?.matches('i')) {
      getChildren.className = this.direction in obj ? obj[this.direction] : '';
    }
    this.sort.emit({ column: this.sortable, direction: this.direction });
  }
}
