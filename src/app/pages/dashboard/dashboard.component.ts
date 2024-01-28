import { Component, inject, OnInit } from '@angular/core';
import Chart from 'chart.js/auto';
import { Task } from '@models/task.model';
import { TasksService } from '@services/tasks.service';
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
  // Initialize variables for the chart, start date, and end date
  chart: any = [];
  startDate: Date | null;
  endDate: Date | null;

  // Instance of TasksService for fetching tasks data
  tasksService = inject(TasksService);

  ngOnInit() {
    // Call the function to generate the chart
    this.generateChart();
  }

  // Function to generate the chart using TasksService data
  generateChart() {
    // Subscribe to the tasks data from the TasksService
    this.tasksService.bindTasks().subscribe(response => {
      // Analyze the tasks data to extract relevant information
      const analyzeData = this.analyzeData(response?.data);

      // Extract status counts and start/end dates
      const { New, Inprogress, Onhold, Completed } = analyzeData.statusCounts;
      this.startDate = analyzeData.startDate;
      this.endDate = analyzeData.endDate;

      // Create a new Chart instance using Chart.js library
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

  // Function to analyze tasks data and extract relevant information
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
