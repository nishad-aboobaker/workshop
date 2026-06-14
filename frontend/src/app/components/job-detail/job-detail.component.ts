import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { JobService, Job, RepairItem, PaymentDetails } from "../../services/job.service";

@Component({
  selector: "app-job-detail",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./job-detail.component.html"
})
export class JobDetailComponent implements OnInit {
  job: Job | null = null;
  whatsappLink = "";

  repairs: RepairItem[] = [];
  payment: PaymentDetails = { mode: 'cash', gpayAmount: 0, cashAmount: 0, totalAmount: 0 };

  constructor(private route: ActivatedRoute, private jobService: JobService) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get("id")!;
    this.jobService.getOne(id).subscribe(job => {
      this.job = job;
      if (job.status !== 'delivered') {
        const issues = job.issueDescription.split(',').map(s => s.trim()).filter(s => s);
        this.repairs = issues.map(issue => ({ issue, partsCost: 0, labourCost: 0 }));
      }
    });
  }

  get totalCost(): number {
    return this.repairs.reduce((acc, r) => acc + (Number(r.partsCost) || 0) + (Number(r.labourCost) || 0), 0);
  }

  markRepairCompleted() {
    if (!this.job) return;
    const payload = { repairs: this.repairs };
    
    this.jobService.updateStatus(this.job._id, payload).subscribe({
      next: (res) => {
        this.job = res.job;
        this.whatsappLink = res.whatsappLink;
        window.open(res.whatsappLink, "_blank");
      },
      error: (err) => {
        const msg = err.error?.error || err.message;
        alert("Failed to mark repair completed: " + msg);
        console.error(err);
      }
    });
  }

  markDelivered() {
    if (!this.job) return;
    this.payment.totalAmount = this.totalCost;
    
    if (this.payment.mode === 'cash') {
      this.payment.cashAmount = this.totalCost;
      this.payment.gpayAmount = 0;
    } else if (this.payment.mode === 'gpay') {
      this.payment.gpayAmount = this.totalCost;
      this.payment.cashAmount = 0;
    }

    const payload = { payment: this.payment };

    this.jobService.updateStatus(this.job._id, payload).subscribe({
      next: (res) => {
        this.job = res.job;
        this.whatsappLink = res.whatsappLink;
        window.open(res.whatsappLink, "_blank");
      },
      error: (err) => {
        const msg = err.error?.error || err.message;
        alert("Failed to complete delivery: " + msg);
        console.error(err);
      }
    });
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
