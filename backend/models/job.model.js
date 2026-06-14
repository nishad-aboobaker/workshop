const mongoose = require("mongoose");

const stepSchema = new mongoose.Schema({
  label: String,
  note: String,
  timestamp: { type: Date, default: Date.now }
});

const jobSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  bikeModel: { type: String, required: true },
  vehicleNumber: { type: String, default: "N/A" },
  issueDescription: { type: String, required: true },
  status: {
    type: String,
    enum: ["received", "diagnosing", "waiting_parts", "in_repair", "ready", "delivered"],
    default: "received"
  },
  steps: [stepSchema],
  repairs: [{
    issue: String,
    partsCost: { type: Number, default: 0 },
    labourCost: { type: Number, default: 0 }
  }],
  payment: {
    mode: { type: String, enum: ['gpay', 'cash', 'split'] },
    gpayAmount: { type: Number, default: 0 },
    cashAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 }
  },
  totalCharges: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
  deliveredAt: { type: Date, default: null }
});

module.exports = mongoose.model("Job", jobSchema);
