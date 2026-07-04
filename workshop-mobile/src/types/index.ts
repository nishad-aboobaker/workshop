export type JobStatus = 'received' | 'diagnosing' | 'waiting_parts' | 'in_repair' | 'ready' | 'delivered';

export type PaymentMode = 'gpay' | 'cash' | 'split';

export interface JobStep {
  id?: number;
  job_id: number;
  label: string;
  note: string;
  timestamp: string;
}

export interface RepairItem {
  id?: number;
  job_id: number;
  issue: string;
  parts_cost: number;
  labour_cost: number;
}

export interface PaymentDetails {
  id?: number;
  job_id: number;
  mode: PaymentMode;
  gpay_amount: number;
  cash_amount: number;
  total_amount: number;
}

export interface Job {
  id: number;
  customer_name: string;
  customer_phone: string;
  bike_model: string;
  vehicle_number: string;
  issue_description: string;
  status: JobStatus;
  total_charges: number | null;
  created_at: string;
  delivered_at: string | null;
  steps?: JobStep[];
  repairs?: RepairItem[];
  payment?: PaymentDetails | null;
}

export interface DailyRevenue {
  dateStr: string;
  cash: number;
  gpay: number;
  total: number;
}

export const STATUS_COLORS: Record<JobStatus, string> = {
  received: '#3498db',
  diagnosing: '#f39c12',
  waiting_parts: '#e67e22',
  in_repair: '#9b59b6',
  ready: '#27ae60',
  delivered: '#95a5a6',
};

export const STATUS_LABELS: Record<JobStatus, string> = {
  received: 'Received',
  diagnosing: 'Diagnosing',
  waiting_parts: 'Waiting Parts',
  in_repair: 'In Repair',
  ready: 'Ready',
  delivered: 'Delivered',
};

export interface Expense {
  id: number;
  description: string;
  amount: number;
  created_at: string;
}
