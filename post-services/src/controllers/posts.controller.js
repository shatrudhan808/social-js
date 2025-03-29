const Post = require('../models/post.model')
const logger = require('../utils/logger')
const { publishEvent } = require('../utils/rabbitmq')
const { validateCreatePost } = require('../utils/validation')

async function invalidatePostCache(req, input) {
    // single post
    const cacheKey = `post:${input}`
    await req.redisClient.del(cacheKey)
    // all post
    const keys = await req.redisClient.keys('posts:*')
    if(keys.lenght > 0){
        await req.redisClient.del(keys)
    }
}

const createPost = async (req, res) => {
    logger.info('create Post end point hit ...')
    try {
        const {error} = validateCreatePost(req.body)
        if(error){
            logger.warn('Create post error', error.details[0].message)
            return res.status(400).json({
                success : false,
                message : error.details[0].message
            })
        }
        const {content, mediaIds} = req.body
        const newlyCreatedPost = new Post({
            user : req.user._id,
            content,
            mediaIds : mediaIds || []
        })
        await newlyCreatedPost.save()
         await publishEvent('post.created',{
            posiId : newlyCreatedPost._id.toString(),
            userId : newlyCreatedPost.user.toHexString(),
            content : newlyCreatedPost.content,
            createdAt : newlyCreatedPost.createdAt
         })
        await invalidatePostCache(req, newlyCreatedPost._id.toString())
        logger.info('Post created successfully ', newlyCreatedPost)
        res.status(201).json({
            success : true,
            success : 'Post created successfully '
        })
        
    } catch (error) {
        logger.error('Error creating post : ', error)
        res.status(500).json({
            success : false,
            message : 'Internal server error'
        })
    }
}

const getAllPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const startIndex = (page -1) * limit

        const cacheKey = `posts:${page}:${limit}`

        const cachedPosts = await req.redisClient.get(cacheKey)
        if(cachedPosts){
            return res.json(JSON.parse(cachedPosts))
        }
        const posts = await Post.find({}).sort({createdAt : -1}).skip(startIndex).limit(limit)
        const totalPosts = await Post.countDocuments()
        const result = {
            posts,
            currentPage : page,
            totalPages : Math.ceil(totalPosts/limit),
            totalPosts
        }
        // save your post in redis cache
        await req.redisClient.setex(cacheKey, 300, JSON.stringify(result))
        res.status(200).json({
            success : true,
            result
        })
        
    } catch (error) {
        logger.error('Error fetching posts : ', error)
        res.status(500).json({
            success : false,
            message : 'Internal server error'
        })
    }
}

const getPost = async (req, res) => {
    try {
        const postId = req.params.id
        const cacheKey = `post:${postId}`
         const cachedPost = await req.redisClient.get(cacheKey)
        if(cachedPost){
            return res.json(JSON.parse(cachedPost))
        }
        const singlePost = await Post.findById(postId)
        if(!singlePost){
            return res.status(404).json({
                success : false,
                message : 'Post not found',
            })
        }
        await req.redisClient.setex(cachedPost,3600, JSON.stringify(singlePost))
        res.status(200).json({
            success : true,
            message : 'Record found',
            singlePost
        })

        
    } catch (error) {
        logger.error('Error fetching post : ', error)
        res.status(500).json({
            success : false,
            message : 'Internal server error'
        })
    }
} 

const detelePost = async (req, res) => {
    try {
        const post = await Post.findByIdAndDelete({
            _id : req.params.id,
            user : req.user._id
        })
        if(!post){
            return res.status(404).json({
                success : false,
                message : 'Post not found',
            })
        }
        // publish post delete method
        await publishEvent('post.deleted',{
            posiId : post._id.toString(),
            user : req.user._id,
            mediaIds : post.mediaIds

        })
        await invalidatePostCache(req, req.params.id)
        res.json({
            success : true,
            message : 'Post deleted successfully'
        })
        
    } catch (error) {
        logger.error('Error deleting post : ', error)
        res.status(500).json({
            success : false,
            message : 'Internal server error'
        })
    }
}


module.exports = {createPost, getAllPosts, getPost, detelePost}