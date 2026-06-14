const Job = require("../models/job.model");
const { generateWhatsAppLink } = require("../services/whatsapp.service");

exports.createJob = async (req, res) => {
  try {
    if (req.body.issueDescription) {
      req.body.issueDescription = req.body.issueDescription.replace(/\n/g, ', ');
    }
    const job = await Job.create(req.body);
    const link = generateWhatsAppLink(job.customerPhone, job.vehicleNumber, job.bikeModel, job.status);
    res.status(201).json({ job, whatsappLink: link });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, note, totalCharges, repairs, payment } = req.body;
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });

    if (repairs && !payment) {
      job.status = "ready";
      job.repairs = repairs;
      const total = repairs.reduce((acc, r) => acc + (Number(r.partsCost) || 0) + (Number(r.labourCost) || 0), 0);
      job.totalCharges = total;
      job.steps.push({ label: "Repair Completed", note: "Repair finished and costs updated." });
    } else if (payment) {
      job.status = "delivered";
      job.payment = payment;
      job.totalCharges = payment.totalAmount;
      job.deliveredAt = new Date();
      job.steps.push({ label: "Delivered", note: "Vehicle delivered and payment received." });
    } else {
      job.status = status || job.status;
      if (totalCharges) job.totalCharges = totalCharges;
      if (status) job.steps.push({ label: status, note });
    }
    
    await job.save();

    const link = generateWhatsAppLink(job.customerPhone, job.vehicleNumber, job.bikeModel, job.status, note, job.totalCharges, job.payment);
    res.json({ job, whatsappLink: link });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
