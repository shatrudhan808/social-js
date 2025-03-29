
const express = require('express')
const { createPost, getAllPosts, getPost, detelePost } = require('../controllers/posts.controller')
const {isAuthenticated} = require('../middlewares/auth.middleware')
const router = express.Router()

// middleware -> this will check that user user is an authentic or not
router.use(isAuthenticated)


router.post('/create-post', createPost)
router.get('/all-posts', getAllPosts)
router.get('/get-post/:id', getPost)
router.delete('/delete-post/:id', detelePost)

module.exports = router