
require('dotenv').config()

const mongoose = require('mongoose')
const logger = require('./utils/logger')
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const {RateLimiterRedis} = require('rate-limiter-flexible')
const Redis = require('ioredis')
const {rateLimit} = require('express-rate-limit')
const {RedisStore} = require('rate-limit-redis')
const authRoutes = require('./routes/identity.routes')
const errorHandler = require('./middlewares/errorHandler')

const app = express()

// connect database

mongoose.connect(process.env.MONGODB_URI).then( ()=>{
    logger.info('Connected to mongodb ')
}).catch( (error)=>{
    logger.error('Mongodb connection error', error)
})

const redisClient = new Redis(process.env.REDIS_URL)
// middleware 
app.use(helmet())
app.use(cors())
app.use(express.json())

app.use( (req, res, next)=>{
    logger.info(` Recieved ${req.method} request to ${req.url}`)
    logger.info(` Request body, ${req.body}`)
    next()
})
// DDos protection and rate limiting here

const rateLimiter = new RateLimiterRedis({
    storeClient : redisClient,
    keyPrefix : 'middleware',
    points : 10,
    duration : 1
})

app.use( (req, res, next)=>{
    rateLimiter.consume(req.ip).then( ()=> next()).catch( ()=>{
        logger.warn(` Rate limit exceeded for Ip: ${req.ip}`)
        res.status(429).json({
            success : false,
            message : 'Too many requests'
        })
    })
})

// Ip based rate limiting for sensetive end points

const sensetiveEndPointLimiter = rateLimit({
    windowMs : 15 * 60*1000,
    max : 50,
    standardHeaders : true,
    legacyHeaders : false,
    handler : (req, res) => {
        logger.warn(` Sensetive end points rate limit exceeted for Ip : ${req.ip}`)
        res.status(429).json({
            success : false,
            message : 'Too many requests'
        })
    },
    store : new RedisStore({
        sendCommand : (...args) => redisClient.call(...args)
    })
})
// apply this sensetiveEndPointLimiter to our routes

app.use('/api/auth/register', sensetiveEndPointLimiter)

// routes 
app.use('/api/auth', authRoutes)

// errorHandler
app.use(errorHandler)

app.listen(process.env.PORT, ()=>{
    logger.info(`Identity services running on port : ${process.env.PORT}`)
})

// unhandle promise rejection

process.on('unhandledRejection', (reason, promise)=>{
    logger.error('Unhandled Rejection at: ', promise, 'reason : ', reason)
})

