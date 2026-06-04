const express = require('express')
const cors    = require('cors')
const app     = express()
const port    = 3000

const db              = require('./models')
const { verifyToken } = require('./middlewares/auth')

const authRouter    = require('./routes/auth.route')
const serviceRouter = require('./routes/service.route')
const bookingRouter = require('./routes/booking.route')
const paymentRouter = require('./routes/payment.route')
const reportRouter  = require('./routes/report.route')
const profileRouter = require('./routes/profile.route')

// cek koneksi database
db.sequelize.authenticate()
  .then(() => console.log('Database terhubung'))
  .catch(e  => console.error('Gagal koneksi DB:', e.message))

app.use(express.json())
app.use(cors())
app.use('/uploads', express.static('uploads'))

// auth tidak perlu token
app.use('/auth',     authRouter)

// semua route di bawah perlu token
app.use('/services', verifyToken, serviceRouter)
app.use('/bookings', verifyToken, bookingRouter)
app.use('/payments', verifyToken, paymentRouter)
app.use('/reports',  verifyToken, reportRouter)
app.use('/profile',  verifyToken, profileRouter)

app.get('/', (req, res) => res.send('Dream Beauty Salon API - Ready!'))

app.listen(port, () => console.log(`Server jalan di http://localhost:${port}`))
