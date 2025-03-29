const express = require('express')
const {searchPostController} = require('../controllers/search.controller')
const {isAuthenticated} = require('../middlewares/auth.middleware')

const router = express.Router()

router.use(isAuthenticated)

router.get('/search', searchPostController)

module.exports = router