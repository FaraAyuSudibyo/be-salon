const Validator = require("fastest-validator");
const validator = new Validator();
const { Op } = require("sequelize");
const { Booking, Service, User, Payment, Review } = require("../models");
const { response } = require("../helpers/response.formatter");

const BIAYA_HOME_SERVICE = 50000;

function formatBooking(dataBooking) {
  const dataPayment = dataBooking.payment || null;
  const dataReview = dataBooking.review || null;
  const dataService = dataBooking.service || null;
  const dataUser = dataBooking.user || null;

  return {
    id: Number(dataBooking.id_bookings),
    customerId: Number(dataBooking.id_users),
    customerName: dataUser ? dataUser.username : "",
    customerPhone: dataUser ? dataUser.phone : "",
    serviceId: Number(dataBooking.id_services),
    serviceName: dataService ? dataService.name : "",
    servicePrice: dataService ? dataService.price : 0,
    serviceType: dataBooking.service_type,
    address: dataBooking.address || "",
    totalPrice: dataBooking.total_price,
    date: dataBooking.date,
    time: dataBooking.time,
    status: dataBooking.status,
    notes: dataBooking.notes || "",
    paymentMethod: dataPayment ? dataPayment.method : "",
    paymentStatus: dataPayment ? dataPayment.status : "unpaid",
    paymentProof: dataPayment ? dataPayment.payment_proof : null,
    rejectReason: dataPayment ? dataPayment.reject_reason : null,
    review: dataReview
      ? {
          rating: dataReview.rating,
          comment: dataReview.comment,
          createdAt: dataReview.created_at,
        }
      : null,
    waNotified: false,
    createdAt: dataBooking.created_at,
  };
}

// relasi yang diambil bersama booking
const INCLUDE_SEMUA_RELASI = [
  { model: User, as: "user", attributes: ["id_users", "username", "phone"] },
  {
    model: Service,
    as: "service",
    attributes: ["id_services", "name", "price", "category", "duration"],
  },
  { model: Payment, as: "payment" },
  { model: Review, as: "review" },
];

module.exports = {
  createBooking: async (req, res) => {
    try {
      const {
        serviceId,
        serviceType,
        address,
        date,
        time,
        paymentMethod,
        notes,
      } = req.body;

      const idService = Number(serviceId || req.body.id_services);
      const tipeService = serviceType || "onsite";
      const metodePembayaran = paymentMethod || "transfer";

      const schema = {
        idService: { type: "number", positive: true, integer: true },
        date: { type: "string" },
        time: { type: "string" },
        metodePembayaran: { type: "string" },
      };
      const hasilValidasi = validator.validate(
        { idService, date, time, metodePembayaran },
        schema,
      );
      if (hasilValidasi.length > 0)
        return res
          .status(400)
          .json(response(400, "validasi error", hasilValidasi));

      if (tipeService === "homeservice" && !String(address || "").trim())
        return res
          .status(400)
          .json(
            response(
              400,
              "validasi error",
              "Alamat wajib diisi untuk Home Service",
            ),
          );

      // cek service ada di database
      const dataService = await Service.findByPk(idService);
      if (!dataService)
        return res
          .status(400)
          .json(response(400, "validasi error", "Layanan tidak ditemukan"));

      // hitung total + home service 
      const biayaHomeService =
        tipeService === "homeservice" ? BIAYA_HOME_SERVICE : 0;
      const totalHarga = dataService.price + biayaHomeService;

      // simpan data booking ke database
      const bookingBaru = await Booking.create({
        id_users: req.user.userId,
        id_services: idService,
        date,
        time,
        notes: notes || "",
        status: "pending",
        service_type: tipeService,
        address: address || "",
        home_service_fee: biayaHomeService,
        total_price: totalHarga,
      });

      // buat record payment sekalian
      await Payment.create({
        id_bookings: bookingBaru.id_bookings,
        amount: totalHarga,
        method: metodePembayaran,
        status: "unpaid",
      });

      // ambil data beserta relasinya
      const hasilBooking = await Booking.findByPk(bookingBaru.id_bookings, {
        include: INCLUDE_SEMUA_RELASI,
      });
      return res
        .status(201)
        .json(response(201, "created", formatBooking(hasilBooking)));
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },

  //booking milik customer yang sedang login
  getMyBookings: async (req, res) => {
    try {
      const semuaBookingKu = await Booking.findAll({
        where: { id_users: req.user.userId },
        include: INCLUDE_SEMUA_RELASI,
        order: [["created_at", "DESC"]],
      });
      return res
        .status(200)
        .json(response(200, "success", semuaBookingKu.map(formatBooking)));
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },

  // semua booking (admin)
  getBookings: async (req, res) => {
    try {
      const halamanSekarang = Number(req.query.page) || 1;
      const jumlahPerHalaman = Number(req.query.limit) || 10;
      const posisiAwal = (halamanSekarang - 1) * jumlahPerHalaman;
      const { status, service_type, search } = req.query;

      // pencarian
      const kondisiFilter = {};
      if (status && status !== "semua") kondisiFilter.status = status;
      if (service_type && service_type !== "semua")
        kondisiFilter.service_type = service_type;

      // include relasi, dengan filter pencarian nama customer jika ada
      const includeDenganSearch = [
        {
          model: User,
          as: "user",
          attributes: ["id_users", "username", "phone"],
          where: search ? { username: { [Op.like]: `%${search}%` } } : {},
          required: !!search,
        },
        {
          model: Service,
          as: "service",
          attributes: ["id_services", "name", "price", "category", "duration"],
        },
        { model: Payment, as: "payment" },
        { model: Review, as: "review" },
      ];

      const { count: totalData, rows: dataBooking } =
        await Booking.findAndCountAll({
          where: kondisiFilter,
          include: includeDenganSearch,
          order: [["created_at", "DESC"]],
          offset: posisiAwal,
          limit: jumlahPerHalaman,
          distinct: true,
        });

      return res.status(200).json(
        response(200, "success", {
          data: dataBooking.map(formatBooking),
          currentPage: halamanSekarang,
          totalPage: Math.ceil(totalData / jumlahPerHalaman),
          total: totalData,
          rangeData: `${posisiAwal + 1}-${posisiAwal + dataBooking.length}`,
        }),
      );
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },

  // detail satu booking
  detailBooking: async (req, res) => {
    try {
      const dataBooking = await Booking.findByPk(req.params.id, {
        include: INCLUDE_SEMUA_RELASI,
      });
      if (!dataBooking)
        return res.status(404).json(response(404, "booking not found"));
      return res
        .status(200)
        .json(response(200, "success", formatBooking(dataBooking)));
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },

  // admin ubah status booking
  updateStatus: async (req, res) => {
    try {
      const statusYangValid = [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ];
      const { status } = req.body;

      if (!statusYangValid.includes(status))
        return res
          .status(400)
          .json(response(400, "validasi error", "Status tidak valid"));

      const dataBooking = await Booking.findByPk(req.params.id);
      if (!dataBooking)
        return res.status(404).json(response(404, "booking not found"));

      await Booking.update(
        { status },
        { where: { id_bookings: req.params.id } },
      );
      const hasilUpdate = await Booking.findByPk(req.params.id, {
        include: INCLUDE_SEMUA_RELASI,
      });
      return res
        .status(200)
        .json(response(200, "updated", formatBooking(hasilUpdate)));
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },

  // customer batalkan booking
  cancelBooking: async (req, res) => {
    try {
      const dataBooking = await Booking.findByPk(req.params.id);
      if (!dataBooking)
        return res.status(404).json(response(404, "booking not found"));

      // pastikan booking ini milik customer yang sedang login
      if (Number(dataBooking.id_users) !== req.user.userId)
        return res.status(403).json(response(403, "forbidden"));

      await Booking.update(
        { status: "cancelled" },
        { where: { id_bookings: req.params.id } },
      );
      return res.status(200).json(response(200, "cancelled"));
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },

  // customer ubah jadwal booking
  rescheduleBooking: async (req, res) => {
    try {
      const { date, time } = req.body;
      if (!date || !time)
        return res
          .status(400)
          .json(response(400, "validasi error", "Tanggal dan jam wajib diisi"));

      const dataBooking = await Booking.findByPk(req.params.id);
      if (!dataBooking)
        return res.status(404).json(response(404, "booking not found"));

      // pastikan booking ini milik customer yang sedang login
      if (Number(dataBooking.id_users) !== req.user.userId)
        return res.status(403).json(response(403, "forbidden"));

      await Booking.update(
        { date, time },
        { where: { id_bookings: req.params.id } },
      );
      const hasilUpdate = await Booking.findByPk(req.params.id, {
        include: INCLUDE_SEMUA_RELASI,
      });
      return res
        .status(200)
        .json(response(200, "rescheduled", formatBooking(hasilUpdate)));
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },

  // admin hapus booking
  deleteBooking: async (req, res) => {
    try {
      await Booking.destroy({ where: { id_bookings: req.params.id } });
      return res.status(200).json(response(200, "deleted"));
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },

  // customer tambah review
  addReview: async (req, res) => {
    try {
      const { rating, comment } = req.body;
      if (!rating)
        return res
          .status(400)
          .json(response(400, "validasi error", "Rating wajib diisi"));

      const dataBooking = await Booking.findByPk(req.params.id);
      if (!dataBooking)
        return res.status(404).json(response(404, "booking not found"));

      // pastikan booking ini milik customer yang sedang login
      if (Number(dataBooking.id_users) !== req.user.userId)
        return res.status(403).json(response(403, "forbidden"));

      const reviewBaru = await Review.create({
        id_bookings: Number(req.params.id),
        rating: Number(rating),
        comment: comment || "",
      });
      return res.status(201).json(response(201, "created", reviewBaru));
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },

  // customer edit review
  editReview: async (req, res) => {
    try {
      const { rating, comment } = req.body;
      const dataBooking = await Booking.findByPk(req.params.id);
      if (!dataBooking)
        return res.status(404).json(response(404, "booking not found"));

      // pastikan booking ini milik customer yang sedang login
      if (Number(dataBooking.id_users) !== req.user.userId)
        return res.status(403).json(response(403, "forbidden"));

      await Review.update(
        { rating: Number(rating), comment: comment || "" },
        { where: { id_bookings: req.params.id } },
      );
      const reviewTerbaru = await Review.findOne({
        where: { id_bookings: req.params.id },
      });
      return res.status(200).json(response(200, "updated", reviewTerbaru));
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },

  // customer hapus review
  deleteReview: async (req, res) => {
    try {
      await Review.destroy({ where: { id_bookings: req.params.id } });
      return res.status(200).json(response(200, "deleted"));
    } catch (error) {
      return res.status(500).json(response(500, "server error", error.message));
    }
  },
};
