import { Routes } from "@angular/router";
import { JobListComponent } from "./components/job-list/job-list.component";
import { JobFormComponent } from "./components/job-form/job-form.component";
import { JobDetailComponent } from "./components/job-detail/job-detail.component";
import { PaymentHistoryComponent } from "./components/payment-history/payment-history.component";

export const routes: Routes = [
  { path: "", component: JobListComponent },
  { path: "new", component: JobFormComponent },
  { path: "job/:id", component: JobDetailComponent },
  { path: "payments", component: PaymentHistoryComponent }
];
