import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { JobService } from "../../services/job.service";

@Component({
  selector: "app-job-form",
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: "./job-form.component.html"
})
export class JobFormComponent {
  job = { customerName: "", customerPhone: "", bikeModel: "", vehicleNumber: "", issueDescription: "" };
  loading = false;

  constructor(private jobService: JobService, private router: Router) {}

  submit() {
    this.loading = true;
    this.jobService.create(this.job).subscribe({
      next: (res) => {
        alert("Job created! WhatsApp link: " + res.whatsappLink);
        window.open(res.whatsappLink, "_blank");
        this.router.navigate(["/"]);
      },
      error: (err) => { alert(err.message); this.loading = false; }
    });
  }
}
