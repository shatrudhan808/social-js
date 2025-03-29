const { uplloadMediaToCloudinery } = require('../utils/cloudinery')
const logger = require('../utils/logger')
const Mdeia = require('../models/media.model')
const Media = require('../models/media.model')

const uploadMedia = async(req, res)=>{
    logger.info('Starting media upload')
    try {
        if(!req.file){
            logger.error('File not found, please add a file and try again !')
            return res.status(400).json({
                success  :false,
                message : 'File not found, please add a file and try again !'
            })
        }
        const {originalname, mimetype, buffer, } = req.file
        const _id = req.user._id
        logger.info(` File details: name = ${originalname}, type = ${mimetype}`)
        logger.info('uploading to cloudinery starting...')
        const cloudinaryUploadResult = await uplloadMediaToCloudinery(req.file)
        logger.info(`Cloudinery upload successfully, publicId : ${cloudinaryUploadResult.public_id}`)
        const newlyCreatedMedia = new Media({
            user: _id,
            publicId : cloudinaryUploadResult.public_id,
            originalName: originalname,
            mimeType : mimetype,
            url:cloudinaryUploadResult.secure_url
        })
        await newlyCreatedMedia.save()
        res.status(201).json({
            success : true,
            message : 'Media upload successfully',
            imageId : newlyCreatedMedia._id,
            url : newlyCreatedMedia.url
        })

    } catch (error) {
        logger.error('Error uploading  media : ', error)
        res.status(500).json({
            success : false,
            message : 'Error uploading  media '
        })
    }

}

const getAllMedias = async (req, res) =>{
    try {
        const results = await Media.find({})
        res.json({results})
    } catch (error) {
        logger.error('Error getting all  medias : ', error)
        res.status(500).json({
            success : false,
            message : 'Error getting all  medias'
        }) 
    }
}

module.exports = {uploadMedia, getAllMedias}