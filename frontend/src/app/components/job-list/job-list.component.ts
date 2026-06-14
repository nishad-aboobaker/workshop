import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { JobService, Job } from "../../services/job.service";

@Component({
  selector: "app-job-list",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: "./job-list.component.html" 
})
export class JobListComponent implements OnInit {
  jobs: Job[] = [];
  searchTerm: string = "";

  get filteredJobs(): Job[] {
    if (!this.searchTerm) return this.jobs;
    return this.jobs.filter(j => 
      j.vehicleNumber && j.vehicleNumber.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  get pendingJobsCount(): number {
    return this.jobs.filter(j => j.status !== 'delivered').length;
  }

  private isToday(dateStr: string | Date | undefined): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  get totalCashCollected(): number {
    return this.jobs
      .filter(j => j.status === 'delivered' && this.isToday(j.deliveredAt))
      .reduce((sum, j) => sum + (j.payment?.cashAmount || 0), 0);
  }

  get totalGPayCollected(): number {
    return this.jobs
      .filter(j => j.status === 'delivered' && this.isToday(j.deliveredAt))
      .reduce((sum, j) => sum + (j.payment?.gpayAmount || 0), 0);
  }

  constructor(private jobService: JobService) {}

  ngOnInit() {
    this.jobService.getAll().subscribe(jobs => this.jobs = jobs);
  }

  statusColor(status: string): string {
    const map: any = {
      received: "#3498db",
      diagnosing: "#f39c12",
      waiting_parts: "#e67e22",
      in_repair: "#9b59b6",
      ready: "#27ae60",
      delivered: "#95a5a6"
    };
    return map[status] || "#333";
  }
}
