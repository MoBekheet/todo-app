import { Component, inject, OnInit } from '@angular/core';
import Chart from 'chart.js/auto';
import { Task } from '../../shared/models/task.model';
import { TasksService } from '../../shared/services/tasks.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe],
  providers: [TasksService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  chart: any = [];
  startDate: Date | null;
  endDate: Date | null;
  tasksService = inject(TasksService);

  ngOnInit() {
    this.generateChart();
  }

  generateChart() {
    this.tasksService.bindTasks().subscribe(response => {
      const analyzeData = this.analyzeData(response?.data);
      const { New, Inprogress, Onhold, Completed } = analyzeData.statusCounts;
      this.startDate = analyzeData.startDate;
      this.endDate = analyzeData.endDate;
      this.chart = new Chart('canvas', {
        type: 'bar',
        data: {
          labels: ['New', 'In progress', 'On hold', 'Complete'],
          datasets: [
            {
              barThickness: 30,
              data: [New, Inprogress, Onhold, Completed],
              borderSkipped: false,
              backgroundColor: ['#4CAF50', '#2196F3', '#FFC107', '#757575'],
              borderRadius: 5,
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              display: false,
            },
          },
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: tickValue => tickValue + '%',
              },
            },
          },
        },
      });
    });
  }

  analyzeData(tasks: Task[]) {
    // Prepare data for analysis
    const analysisData = {
      startDate: null as Date | null,
      endDate: null as Date | null,
      statusCounts: {} as { [status: string]: number },
    };

    // Analysis loop
    for (const task of tasks) {
      // Extract the start date
      const taskStartDate = new Date(task.startDate);

      // Start date
      if (!analysisData.startDate || taskStartDate < analysisData.startDate) {
        analysisData.startDate = taskStartDate;
      }

      // End date
      if (!analysisData.endDate || taskStartDate > analysisData.endDate) {
        analysisData.endDate = taskStartDate;
      }

      // Extract status without spaces between words
      const status = task.status.split(' ').join('');

      // Count the statuses
      analysisData.statusCounts[status] = (analysisData.statusCounts[status] || 0) + 1;
    }

    return analysisData;
  }
}
