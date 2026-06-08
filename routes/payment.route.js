const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const { verifyAdmin } = require("../middlewares/auth");
const ctrl = require("../controllers/payment.controller");

router.patch(
  "/:id/upload-proof",
  upload.single("payment_proof"),
  ctrl.uploadProof,
);

// admin
router.get("/", verifyAdmin, ctrl.getPayments);
router.patch("/:id/confirm", verifyAdmin, upload.none(), ctrl.confirmPayment);
router.patch("/:id/reject", verifyAdmin, upload.none(), ctrl.rejectPayment);

module.exports = router;
