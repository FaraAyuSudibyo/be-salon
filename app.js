const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;
const db = require("./models");
const { verifyToken } = require("./middlewares/auth");

const routerAuth = require("./routes/auth.route");
const routerService = require("./routes/service.route");
const routerBooking = require("./routes/booking.route");
const routerPayment = require("./routes/payment.route");
const routerReport = require("./routes/report.route");
const routerProfile = require("./routes/profile.route");

db.sequelize
  .authenticate()
  .then(() => console.log("Database terhubung"))
  .catch((error) => console.error("Gagal koneksi DB:", error.message));

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

app.use("/auth", routerAuth);
app.use("/services", routerService);
app.use("/bookings", verifyToken, routerBooking);
app.use("/payments", verifyToken, routerPayment);
app.use("/reports", verifyToken, routerReport);
app.use("/profile", verifyToken, routerProfile);

app.get("/", (req, res) => res.send("Dream Beauty Salon API - Ready!"));

app.listen(port, () =>
  console.log(`Server berjalan di http://localhost:${port}`),
);
