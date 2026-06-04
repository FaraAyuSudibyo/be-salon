const express = require('express')
const router  = express.Router()
const upload  = require('../middlewares/upload')
const ctrl    = require('../controllers/auth.controller')

router.post('/register', upload.none(), ctrl.register)
router.post('/login',    upload.none(), ctrl.login)

module.exports = router
