const logger = require("../utils/logger")
const Search = require('../models/search.model')

const searchPostController = async (req, res) => {
    logger.info('Search end point hit ...')
    try {
        const {query} = req.query
        const results = await Search.find(
            {
            $text:{$search : query}
        },
        {
            score : {$meta : 'textScore'}
        }
    ).sort({score : {$meta : 'textScore'}}).limit(10)

    res.json(results)
        
    } catch (error) {
        logger.error('Error in Searching post : ', error)
        res.status(500).json({
            success : false,
            message : 'Error in Searching post'
        })
    }
}

module.exports = { searchPostController}