
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const Redis = require('ioredis')
const helmet = require('helmet')
const {rateLimit} = require('express-rate-limit')
const {RedisStore} = require('rate-limit-redis')
const logger = require('./utils/logger')
const proxy = require('express-http-proxy')
const errorHandler = require('./middlewares/errorHandler')
const { validateToken } = require('./middlewares/auth.middleware')



const app = express()
const PORT = process.env.PORT || 3000
// create redis client
const redisClient = new Redis(process.env.REDIS_URL)
// middleware

app.use(helmet())
app.use(cors())
app.use(express.json())

// rate limiting 
const ratelimitOpions = rateLimit({
    windowMs : 15 * 60*1000,
    max : 100,
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
app.use(ratelimitOpions)

// logging middleware
app.use( (req, res, next)=>{
    logger.info(` Recieved ${req.method} request to ${req.url}`)
    logger.info(` Request body, ${req.body}`)
    next()
})
// create proxy to redirect to one service to another service

const proxyOptions = {
    proxyReqPathResolver : (req)=>{
        return req.originalUrl.replace(/^\/v1/, '/api')
    },
    proxyErrorHandler : (err, res, next) =>{
        logger.error(` Proxy error : ${err.message}`)
        res.status(500).json({
            success : false,
            message : 'Internal Server Error',
            error : err.message
        })
    }
}
// setting proxy for identity services

app.use('/v1/auth',proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator : ( proxyReqOpts, srcReq) =>{
        proxyReqOpts.headers["Content-Type"] = "application/json"
        return proxyReqOpts
    },
    userResDecorator : (proxyRes, proxyResData, userReq, userRes)=> {
        logger.info(` Response recieve from Identity Services : ${proxyRes.statusCode}`)
        return proxyResData
    }
}))
// setting proxy for post services
app.use('/v1/posts',validateToken, proxy(process.env.POST_SERVICE_URL,{
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq)=>{
        proxyReqOpts.headers["Content-Type"] = "application/json"
        proxyReqOpts.headers['x-user-id'] = srcReq.user._id
        return proxyReqOpts
    },
    userResDecorator : (proxyRes, proxyResData, userReq, userRes)=> {
        logger.info(` Response recieve from Post Services : ${proxyRes.statusCode}`)
        return proxyResData
    }
}))
// setting proxy for MEDIA services
app.use('/v1/media', validateToken, proxy(process.env.MEDIA_SERVICE_URL, {
   ...proxyOptions,
   proxyReqOptDecorator: (proxyReqOpts, srcReq)=>{
    proxyReqOpts.headers['x-user-id'] = srcReq.user._id
    if(!srcReq.headers['Content-Type'].startsWith('multipart/form-data')){
        proxyReqOpts.headers["Content-Type"] = "application/json"
    }
    return proxyReqOpts  
   },
   userResDecorator : (proxyRes, proxyResData, userReq, userRes)=> {
    logger.info(` Response recieve from Media Services : ${proxyRes.statusCode}`)
    return proxyResData
},
parseReqBody : false,

}))
// setting proxy for Search services
app.use('/v1/search',validateToken, proxy(process.env.SEARCH_SERVICE_URL,{
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq)=>{
        proxyReqOpts.headers["Content-Type"] = "application/json"
        proxyReqOpts.headers['x-user-id'] = srcReq.user._id
        return proxyReqOpts
    },
    userResDecorator : (proxyRes, proxyResData, userReq, userRes)=> {
        logger.info(` Response recieve from Search Services : ${proxyRes.statusCode}`)
        return proxyResData
    }
}))

// error handler
app.use(errorHandler)

app.listen(PORT, ()=>{
    logger.info(`Api Gateway service running on port : ${PORT}`)
    logger.info(`Identity services running on port : ${process.env.IDENTITY_SERVICE_URL}`)
    logger.info(`Post services running on port : ${process.env.POST_SERVICE_URL}`)
    logger.info(`Media services running on port : ${process.env.MEDIA_SERVICE_URL}`)
    logger.info(`Search services running on port : ${process.env.SEARCH_SERVICE_URL}`)
    logger.info(`Redis url : ${process.env.REDIS_URL}`)
})
