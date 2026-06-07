const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;

// import koneksi database dan semua model
const db = require("./models");

// import middleware untuk cek token JWT
const { verifyToken } = require("./middlewares/auth");

// import semua router
const routerAuth = require("./routes/auth.route");
const routerService = require("./routes/service.route");
const routerBooking = require("./routes/booking.route");
const routerPayment = require("./routes/payment.route");
const routerReport = require("./routes/report.route");
const routerProfile = require("./routes/profile.route");

// cek apakah koneksi ke database berhasil
db.sequelize
  .authenticate()
  .then(() => console.log("Database terhubung"))
  .catch((error) => console.error("Gagal koneksi DB:", error.message));

// express.json() : agar bisa menerima dan mengirim data JSON
app.use(express.json());
// cors : agar frontend bisa mengakses API ini
app.use(cors());
// static('uploads') : agar file gambar di folder uploads bisa diakses lewat browser
app.use("/uploads", express.static("uploads"));

// daftarkan semua route
// /auth tidak butuh token (login & register)
app.use("/auth", routerAuth);
// route di bawah ini semua butuh token JWT (harus login dulu)
app.use("/services", routerService);
app.use("/bookings", verifyToken, routerBooking);
app.use("/payments", verifyToken, routerPayment);
app.use("/reports", verifyToken, routerReport);
app.use("/profile", verifyToken, routerProfile);

// route utama untuk cek apakah server berjalan
app.get("/", (req, res) => res.send("Dream Beauty Salon API - Ready!"));

app.listen(port, () =>
  console.log(`Server berjalan di http://localhost:${port}`),
);
