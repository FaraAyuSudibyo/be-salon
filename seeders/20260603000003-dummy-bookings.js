"use strict";
const { Service, Booking, User } = require("../models");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const services = await Service.findAll();
    const data = [];
    const HOME_FEE = 50000;

    // ambil customer yang sudah di-seed
    const users = await User.findAll({
      attributes: ["id_users", "role"],
    });
    const customer = users.find((u) => u.role === "customer");

    // daftar tanggal yang sudah pasti valid
    const dates = [
      "2025-06-01",
      "2025-06-05",
      "2025-06-10",
      "2025-06-15",
      "2025-06-20",
      "2025-07-01",
      "2025-07-05",
      "2025-07-10",
      "2025-07-15",
      "2025-07-20",
    ];

    // membuat data booking sebanyak 10
    for (let i = 1; i <= 10; i++) {
      const randomService =
        services[Math.floor(Math.random() * services.length)];
      // mengambil service secara acak
      // .floor = membulatkan (ambil angka sebelum koma), .random = generate desimal 0-1
      // contoh: random (0.5), services.length (7) : 0.5 * 7 = 3.5 : floor = 3 (index ke-3)

      const serviceType = i % 3 === 0 ? "homeservice" : "onsite";
      // setiap kelipatan 3 dijadikan homeservice, sisanya onsite

      const fee = serviceType === "homeservice" ? HOME_FEE : 0;
      const total_price = randomService.price + fee;

      // variasi status booking
      const statusList = [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ];
      const status = statusList[i % statusList.length];

      data.push({
        id_users: customer.id_users,
        id_services: randomService.id_services,
        date: dates[i - 1], // ambil dari array tanggal valid
        time: `${9 + (i % 8)}:00`, // variasi jam 09:00 - 16:00
        notes: i % 2 === 0 ? `Catatan booking ke-${i}` : "",
        status: status,
        service_type: serviceType,
        address:
          serviceType === "homeservice" ? `Jl. Contoh No. ${i}, Kota` : "",
        home_service_fee: fee,
        total_price: total_price,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    await queryInterface.bulkInsert("bookings", data);

    // ambil booking yang baru dibuat untuk dijadikan relasi payments
    const bookings = await Booking.findAll({
      attributes: ["id_bookings", "total_price", "status"],
      order: [["id_bookings", "ASC"]],
    });

    const paymentData = [];
    const methodList = ["transfer", "qris", "cash"];

    for (let i = 0; i < bookings.length; i++) {
      const b = bookings[i];
      // variasi status payment berdasarkan status booking
      let payStatus = "unpaid";
      if (b.status === "completed") payStatus = "paid";
      if (b.status === "confirmed") payStatus = "pending_verification";
      if (b.status === "in_progress") payStatus = "pending_verification";

      paymentData.push({
        id_bookings: b.id_bookings,
        amount: b.total_price,
        method: methodList[i % methodList.length],
        // menggilir method: transfer, qris, cash, transfer, qris, cash, dst
        status: payStatus,
        payment_proof: null,
        reject_reason: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    // simpan data ke tabel payments
    await queryInterface.bulkInsert("payments", paymentData);
  },

  async down(queryInterface, Sequelize) {
    // menghapus data
    await queryInterface.bulkDelete("reviews", null, {});
    await queryInterface.bulkDelete("payments", null, {});
    await queryInterface.bulkDelete("bookings", null, {});
  },
};
