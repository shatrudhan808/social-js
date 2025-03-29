require('dotenv').config()
const mongoose = require('mongoose')
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const Redis = require('ioredis')
const logger = require('./utils/logger')
const errorHandler = require('./middlewares/errorHandler')
const { connectToRabbitMq, consumeEvent } = require('./utils/rabbitmq')
const SearchRoutes = require('./routes/search.routes')
const {handlePostCreation, handlePostDeleted} = require('./eventHandler/searchEventHandler')

const app = express()
const PORT = process.env.PORT || 3004

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

app.use('/api/posts', SearchRoutes)

app.use(errorHandler)

async function startServer() {
    try {
        await connectToRabbitMq()
        await consumeEvent('post.created', handlePostCreation)
        await consumeEvent('post.deleted', handlePostDeleted)
        app.listen(process.env.PORT, ()=>{
            logger.info(`Search services running on port : ${process.env.PORT}`)
        })

    } catch (error) {
       logger.error('Failed to connect to server', error) 
       process.exit(1)
    }
}
startServer()