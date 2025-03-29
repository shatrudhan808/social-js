
const cloudinery = require('cloudinary').v2
const { error } = require('winston')
const logger = require('./logger')

cloudinery.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key:process.env.API_KEY,
    api_secret:process.env.API_SECRET
})

const uplloadMediaToCloudinery = (file) =>{
    return new Promise( (resolve, reject)=>{
        const uploadStream = cloudinery.uploader.upload_stream(
            {
            resource_type : 'auto',

        },
        (error, result)=>{
            if(error){
                logger.error('Error while uploading media to cloudinery', error)
                reject(error)
            }else{
                resolve(result)
            }
        }
    )
    uploadStream.end(file.buffer)

    })
}

const deleteMediaFromCloudinery = async(publicId)=>{
    try {
        const result = await cloudinery.uploader.destroy(publicId)
        logger.info('media deleted successfully from cloudinery', publicId)
        return result
        
    } catch (error) {
        logger.error('Error while deleting media to cloudinery', error)
        throw error
    }
}

module.exports = {uplloadMediaToCloudinery, deleteMediaFromCloudinery}