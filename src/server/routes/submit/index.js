const express = require("express");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const io = require("../../socket").getio();

const router = express.Router();

const jobQueue = require("./queue");

const { upsertSubmission } = require("./schema");

// router.use(bodyParser.json());
// router.use(bodyParser.urlencoded({ extended: true }));

router
  .route("/")

  .get((req, res) => {
    return res.render("index.ejs", {
      user: JSON.stringify(req.session.passport)
    });
  })

  // POST submission file
  .post(upload.fields([{ name: "qid" }, { name: "myfile" }]), (req, res) => {
    // .post(upload.fields([{ name: "myfile", maxCount: 1 }]), (req, res) => {
    // console.log("POST submit", req.body);
    // console.log("files", req.files);
    // console.log("body:", req.body);
    // Create
    const job = jobQueue.createJob({
      user: req.user.id,
      files: req.files.myfile,
      question_id: req.body.qid // question id
    });
    // On job successful, emit socket
    job

      .on("succeeded", function(result) {
        console.log("completed job " + job.id + " result ", result);
        let payload = {
          submission_id: parseInt(job.id),
          question_id: parseInt(req.body.qid),
          status: "Pending"
        };
        io.to(req.user.id).emit("alert", {
          type: "result",
          ...payload
        });
        // Save in DB
        upsertSubmission(payload);
      })

      // On job failure, emit socket
      .on("failed", err => {
        console.log(`job failed with error ${err.message}.`);
        let payload = {
          submission_id: parseInt(job.id),
          status: "Completed",
          error: err.message
        };
        io.to(req.user.id).emit("alert", {
          type: "result",
          ...payload
        });
        // Save in DB
        upsertSubmission(payload);
      })

      .save()
      .then(job => {
        io.to(req.user.id).emit("alert", {
          type: "message",
          message: `Submit on question ${req.body.qid} received with jobid ${
            job.id
          }`
        });
      });

    return res.send("submitted");
  });

module.exports = router;
