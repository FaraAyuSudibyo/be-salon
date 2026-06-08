const path = require("path");
const fs = require("fs");
const { Payment, Booking } = require("../models");
const { response } = require("../helpers/response.formatter");

module.exports = {
  // semua data pembayaran (admin)
  getPayments: async (req, res) => {
    try {
      const kondisiFilter = {};
      if (req.query.status && req.query.status !== "semua") {
        kondisiFilter.status = req.query.status;
      }

      const semuaPembayaran = await Payment.findAll({
        where: kondisiFilter,
        include: [{ model: Booking, as: "booking" }],
        order: [["created_at", "DESC"]],
      });
      return res.status(200).json(response(200, "success", semuaPembayaran));
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },

  uploadProof: async (req, res) => {
    try {
      // pastikan file bukti pembayaran ada
      if (!req.file)
        return res
          .status(400)
          .json(response(400, "Bukti pembayaran harus diupload"));

      // cek apakah booking ada
      const dataBooking = await Booking.findByPk(req.params.id);
      if (!dataBooking)
        return res.status(404).json(response(404, "booking not found"));

      // pastikan booking ini milik customer yang sedang login
      if (Number(dataBooking.id_users) !== req.user.userId)
        return res.status(403).json(response(403, "forbidden"));

      // cek apakah record payment ada
      const dataPembayaran = await Payment.findOne({
        where: { id_bookings: req.params.id },
      });
      if (!dataPembayaran)
        return res.status(404).json(response(404, "payment not found"));

      // hapus bukti pembayaran lama jika ada
      const namaBuktiLama = dataPembayaran.getDataValue("payment_proof");
      if (namaBuktiLama && !namaBuktiLama.startsWith("http")) {
        const lokasiFileLama = path.join(
          __dirname,
          "../uploads",
          namaBuktiLama,
        );
        if (fs.existsSync(lokasiFileLama)) fs.unlinkSync(lokasiFileLama);
      }

      // simpan bukti pembayaran baru dan ubah status menjadi pending_verification
      await Payment.update(
        {
          payment_proof: req.file.filename,
          status: "pending_verification",
          reject_reason: null,
        },
        { where: { id_bookings: req.params.id } },
      );

      const pembayaranTerbaru = await Payment.findOne({
        where: { id_bookings: req.params.id },
      });
      return res.status(200).json(response(200, "uploaded", pembayaranTerbaru));
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },

  // admin konfirmasi pembayaran
  confirmPayment: async (req, res) => {
    try {
      const dataPembayaran = await Payment.findOne({
        where: { id_bookings: req.params.id },
      });
      if (!dataPembayaran)
        return res.status(404).json(response(404, "payment not found"));

      // ubah status pembayaran menjadi paid
      await Payment.update(
        { status: "paid" },
        { where: { id_bookings: req.params.id } },
      );

      const pembayaranTerbaru = await Payment.findOne({
        where: { id_bookings: req.params.id },
      });
      return res
        .status(200)
        .json(response(200, "payment confirmed", pembayaranTerbaru));
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },

  // admin tolak pembayaran
  rejectPayment: async (req, res) => {
    try {
      const dataPembayaran = await Payment.findOne({
        where: { id_bookings: req.params.id },
      });
      if (!dataPembayaran)
        return res.status(404).json(response(404, "payment not found"));

      // hapus file bukti pembayaran yang ditolak
      const namaBukti = dataPembayaran.getDataValue("payment_proof");
      if (namaBukti && !namaBukti.startsWith("http")) {
        const lokasiFile = path.join(__dirname, "../uploads", namaBukti);
        if (fs.existsSync(lokasiFile)) fs.unlinkSync(lokasiFile);
      }

      // kembalikan status ke unpaid dan simpan alasan penolakan
      await Payment.update(
        {
          status: "unpaid",
          payment_proof: null,
          reject_reason: req.body.reason || "Bukti pembayaran tidak valid",
        },
        { where: { id_bookings: req.params.id } },
      );

      const pembayaranTerbaru = await Payment.findOne({
        where: { id_bookings: req.params.id },
      });
      return res
        .status(200)
        .json(response(200, "payment rejected", pembayaranTerbaru));
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },
};
