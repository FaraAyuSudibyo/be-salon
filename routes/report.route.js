const express         = require('express')
const router          = express.Router()
const { verifyAdmin } = require('../middlewares/auth')
const ctrl            = require('../controllers/report.controller')

router.get('/summary',            verifyAdmin, ctrl.getSummary)
router.get('/revenue-by-service', verifyAdmin, ctrl.getRevenueByService)
router.get('/booking-stats',      verifyAdmin, ctrl.getBookingStats)

module.exports = router
