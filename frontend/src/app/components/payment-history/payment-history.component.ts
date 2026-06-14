import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { JobService, Job } from "../../services/job.service";

interface DailyRevenue {
  dateStr: string;
  cash: number;
  gpay: number;
  total: number;
}

@Component({
  selector: "app-payment-history",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./payment-history.component.html"
})
export class PaymentHistoryComponent implements OnInit {
  dailyRevenues: DailyRevenue[] = [];

  constructor(private jobService: JobService) {}

  ngOnInit() {
    this.jobService.getAll().subscribe(jobs => {
      const deliveredJobs = jobs.filter(j => j.status === 'delivered' && j.deliveredAt);
      
      const grouped = new Map<string, DailyRevenue>();

      deliveredJobs.forEach(job => {
        const dateObj = new Date(job.deliveredAt!);
        const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        
        if (!grouped.has(dateStr)) {
          grouped.set(dateStr, { dateStr, cash: 0, gpay: 0, total: 0 });
        }
        
        const day = grouped.get(dateStr)!;
        day.cash += (job.payment?.cashAmount || 0);
        day.gpay += (job.payment?.gpayAmount || 0);
        day.total += (job.payment?.totalAmount || 0);
      });

      this.dailyRevenues = Array.from(grouped.values());
    });
  }
}
