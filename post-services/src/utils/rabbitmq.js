
const amqp = require('amqplib')
const logger = require('./logger')

let connection = null;
let channel = null;

const EXCHANGE_NAME = 'facebook_events'

async function connectToRabbitMq() {
    try {
        connection = await amqp.connect(process.env.RABITMQ_URL)
        channel = await connection.createChannel()

        await channel.assertExchange(EXCHANGE_NAME, 'topic',{durable: false})
        logger.info('Connected to rabbitmq')
        return channel
        
    } catch (error) {
       logger.error('Error connecting to rabbitmq', error) 
    }
}

async function publishEvent(routinKey, message) {
    if(!channel){
        await connectToRabbitMq()
    }
    channel.publish(EXCHANGE_NAME, routinKey, Buffer.from(JSON.stringify(message)))
    logger.info(` Event Published : ${routinKey}`)
}

module.exports = {connectToRabbitMq, publishEvent}