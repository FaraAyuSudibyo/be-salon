const { Booking, Service, User, Payment } = require("../models");
const { response } = require("../helpers/response.formatter");
const { Op } = require("sequelize");

module.exports = {
  getSummary: async (req, res) => {
    try {
      const pembayaranLunas = await Payment.findAll({
        where: { status: "paid" },
      });
      const totalPendapatan = pembayaranLunas.reduce(
        (total, pembayaran) => total + (pembayaran.amount || 0),
        0,
      );

      const totalBooking = await Booking.count();
      const bookingMenunggu = await Booking.count({
        where: { status: "pending" },
      });
      const pembayaranMenungguKonfirmasi = await Payment.count({
        where: { status: "pending_verification" },
      });
      const jumlahHomeService = await Booking.count({
        where: { service_type: "homeservice" },
      });
      const totalLayanan = await Service.count();
      const totalPelanggan = await User.count({ where: { role: "customer" } });

      return res.status(200).json(
        response(200, "success", {
          totalRevenue: totalPendapatan,
          totalBookings: totalBooking,
          pendingBookings: bookingMenunggu,
          pendingPayments: pembayaranMenungguKonfirmasi,
          homeServiceCount: jumlahHomeService,
          totalServices: totalLayanan,
          totalCustomers: totalPelanggan,
        }),
      );
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },

  getRevenueByService: async (req, res) => {
    try {
      // ambil semua booking yang sudah selesai (completed) dan pembayarannya lunas (paid)
      const bookingSelesai = await Booking.findAll({
        where: { status: "completed" },
        include: [
          { model: Service, as: "service", attributes: ["name"] },
          {
            model: Payment,
            as: "payment",
            where: { status: "paid" },
            required: true,
          },
        ],
      });

      // kelompokkan berdasarkan nama layanan dan hitung total pendapatan
      const kelompokPerLayanan = {};
      bookingSelesai.forEach((dataBooking) => {
        const namaLayanan = dataBooking.service
          ? dataBooking.service.name
          : "Unknown";
        if (!kelompokPerLayanan[namaLayanan]) {
          kelompokPerLayanan[namaLayanan] = {
            service_name: namaLayanan,
            total: 0,
            count: 0,
          };
        }
        kelompokPerLayanan[namaLayanan].total += dataBooking.payment
          ? dataBooking.payment.amount
          : 0;
        kelompokPerLayanan[namaLayanan].count += 1;
      });

      // ubah object menjadi array dan urutkan dari yang terbesar
      const hasilOutput = Object.values(kelompokPerLayanan).sort(
        (a, b) => b.total - a.total,
      );
      return res.status(200).json(response(200, "success", hasilOutput));
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },

  // statistik booking per bulan
  getBookingStats: async (req, res) => {
    try {
      const { month, year } = req.query;

      const kondisiFilter = {};
      if (month && year) {
        // filter booking berdasarkan bulan dan tahun
        kondisiFilter.date = {
          [Op.between]: [
            `${year}-${String(month).padStart(2, "0")}-01`, // tanggal awal bulan
            `${year}-${String(month).padStart(2, "0")}-31`, // tanggal akhir bulan
          ],
        };
      }

      const semuaBooking = await Booking.findAll({ where: kondisiFilter });

      // hitung jumlah booking per status
      return res.status(200).json(
        response(200, "success", {
          pending: semuaBooking.filter(
            (booking) => booking.status === "pending",
          ).length,
          confirmed: semuaBooking.filter(
            (booking) => booking.status === "confirmed",
          ).length,
          in_progress: semuaBooking.filter(
            (booking) => booking.status === "in_progress",
          ).length,
          completed: semuaBooking.filter(
            (booking) => booking.status === "completed",
          ).length,
          cancelled: semuaBooking.filter(
            (booking) => booking.status === "cancelled",
          ).length,
        }),
      );
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },
};
