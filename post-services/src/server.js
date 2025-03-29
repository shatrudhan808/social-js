
require('dotenv').config()
const mongoose = require('mongoose')
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const Redis = require('ioredis')
const logger = require('./utils/logger')
const postRoutes = require('./routes/post.routes')
const errorHandler = require('./middlewares/errorHandler')
const { connectToRabbitMq } = require('./utils/rabbitmq')

const app = express()
const PORT = process.env.PORT || 3002

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

// ** implement  ip based rate limiter

// routes -> also pass redis client
app.use('/api/posts', (req, res, next)=>{
    req.redisClient = redisClient
    next()
}, postRoutes)

app.use(errorHandler)

async function startServer() {
    try {
        await connectToRabbitMq()
        app.listen(process.env.PORT, ()=>{
            logger.info(`Post services running on port : ${process.env.PORT}`)
        })

    } catch (error) {
       logger.error('Failed to connect to server', error) 
       process.exit(1)
    }
}
startServer()


// unhandle promise rejection

process.on('unhandledRejection', (reason, promise)=>{
    logger.error('Unhandled Rejection at: ', promise, 'reason : ', reason)
})
