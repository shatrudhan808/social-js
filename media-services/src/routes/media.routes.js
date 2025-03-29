
const express = require('express')
const multer = require('multer')

const {uploadMedia, getAllMedias} = require('../controllers/media.controller')
const {isAuthenticated} = require('../middlewares/auth.middleware')
const logger = require('../utils/logger')
const { error } = require('winston')

const router = express.Router()
// conigure multer for file upload
const upload = multer({
    storage : multer.memoryStorage,
    limits :{
        fileSize: 5*1024 *1024
    }
}).single('file')

router.post('/upload',isAuthenticated, (req, res, next)=>{
    upload(req, res, function(err){
        if(err instanceof multer.MulterError){
            logger.error('Multer error while uploading:',err)
            return res.status(400).json({
                success : false,
                message : 'Multer error while uploading:',
                error : err.message,
                stack : err.stack
            })
        }else if(err){
            logger.error('Unknown error while uploading:',err)
            return res.status(500).json({
                success : false,
                message : 'Unknown error while uploading:',
                error : err.message,
                stack : err.stack
            })
        }
        if(!req.file){
            return res.status(400).json({
                success : false,
                message : 'File not found',
            }) 
        }
        next()
    })
}, uploadMedia)

router.get('get-media',isAuthenticated,getAllMedias)

module.exports = router