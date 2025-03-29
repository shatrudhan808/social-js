
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

async function consumeEvent(routinKey, callback) {
    if(!channel){
        await connectToRabbitMq()
    }
    const q = await channel.assertQueue('',{exclusive : true})
    await channel.bindQueue(q.queue, EXCHANGE_NAME, routinKey)
    channel.consume(q.queue, (msg)=>{
        if(msg !==null ){
             const content = JSON.parse(msg.content.toString())
             callback(content)
             channel.ack(msg)
        }
    })
    logger.info(`subscribe to event ${routinKey}`)
}

module.exports = {connectToRabbitMq, consumeEvent}