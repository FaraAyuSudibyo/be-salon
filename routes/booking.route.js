const express         = require('express')
const router          = express.Router()
const upload          = require('../middlewares/upload')
const { verifyAdmin } = require('../middlewares/auth')
const ctrl            = require('../controllers/booking.controller')

// customer
router.post('/',                        upload.none(), ctrl.createBooking)
router.get('/my',                                      ctrl.getMyBookings)
router.patch('/:id/cancel',             upload.none(), ctrl.cancelBooking)
router.patch('/:id/reschedule',         upload.none(), ctrl.rescheduleBooking)
router.post('/:id/review',              upload.none(), ctrl.addReview)
router.put('/:id/review',               upload.none(), ctrl.editReview)
router.delete('/:id/review',                           ctrl.deleteReview)

// admin
router.get('/',        verifyAdmin,                    ctrl.getBookings)
router.get('/:id',                                     ctrl.detailBooking)
router.patch('/:id/status', verifyAdmin, upload.none(), ctrl.updateStatus)
router.delete('/:id',  verifyAdmin,                    ctrl.deleteBooking)

module.exports = router
