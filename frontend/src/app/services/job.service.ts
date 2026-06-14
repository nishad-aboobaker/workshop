import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

export interface Step {
  label: string;
  note: string;
  timestamp: Date;
}

export interface RepairItem {
  issue: string;
  partsCost: number;
  labourCost: number;
}

export interface PaymentDetails {
  mode: 'gpay' | 'cash' | 'split';
  gpayAmount: number;
  cashAmount: number;
  totalAmount: number;
}

export interface Job {
  _id: string;
  customerName: string;
  customerPhone: string;
  bikeModel: string;
  vehicleNumber: string;
  issueDescription: string;
  status: string;
  steps: Step[];
  repairs?: RepairItem[];
  payment?: PaymentDetails;
  totalCharges: number | null;
  createdAt: Date;
  deliveredAt?: Date | string;
}

@Injectable({ providedIn: "root" })
export class JobService {
  private api = "http://localhost:3000/api/jobs";

  constructor(private http: HttpClient) {}

  getAll(): Observable<Job[]> {
    return this.http.get<Job[]>(this.api);
  }

  getOne(id: string): Observable<Job> {
    return this.http.get<Job>(`${this.api}/${id}`);
  }

  create(data: Partial<Job>): Observable<any> {
    return this.http.post(this.api, data);
  }

  updateStatus(id: string, data: { status?: string; note?: string; totalCharges?: number; repairs?: RepairItem[]; payment?: PaymentDetails }): Observable<any> {
    return this.http.patch(`${this.api}/${id}/status`, data);
  }
}
