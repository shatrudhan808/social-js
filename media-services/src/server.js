require('dotenv').config()
const mongoose = require('mongoose')
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const logger = require('./utils/logger')
const errorHandler = require('./middlewares/errorHandler')
const mediaRoutes = require('./routes/media.routes')
const { connectToRabbitMq, consumeEvent } = require('./utils/rabbitmq')
const { handlePostDeleted } = require('./eventHandlers/mediaEventHandler')

const app = express()
const PORT = process.env.PORT || 3003

// connect database

mongoose.connect(process.env.MONGODB_URI).then( ()=>{
    logger.info('Connected to mongodb ')
}).catch( (error)=>{
    logger.error('Mongodb connection error', error)
})

// middleware 
app.use(helmet())
app.use(cors())
app.use(express.json())

app.use( (req, res, next)=>{
    logger.info(` Recieved ${req.method} request to ${req.url}`)
    logger.info(` Request body, ${req.body}`)
    next()
})

app.use('/api/media', mediaRoutes)

app.use(errorHandler)

async function startServer() {
    try {
        await connectToRabbitMq()
        // consume all the events 
        await consumeEvent('post.deleted', handlePostDeleted)
        app.listen(process.env.PORT, ()=>{
            logger.info(`Media services running on port : ${process.env.PORT}`)
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