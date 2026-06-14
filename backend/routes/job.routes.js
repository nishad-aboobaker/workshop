const router = require("express").Router();
const { createJob, getAllJobs, getJob, updateStatus } = require("../controllers/job.controller");

router.post("/", createJob);
router.get("/", getAllJobs);
router.get("/:id", getJob);
router.patch("/:id/status", updateStatus);

module.exports = router;
