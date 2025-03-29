
const logger = require('../utils/logger')

const isAuthenticated =  (req, res, next) => {
    const _id = req.headers['x-user-id']
    if(!_id){
        logger.warn(` Access attemted without user id`)
        return res.status(401).json({
            success : false,
            message : 'Authentication required ! please login to continue.'
        })
    }
    req.user ={ _id}
    next()
}

module.exports = {isAuthenticated}