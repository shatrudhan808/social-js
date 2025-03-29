const e = require("cors")
const logger = require("../utils/logger")
const Media = require("../models/media.model")
const { deleteMediaFromCloudinery } = require("../utils/cloudinery")

const handlePostDeleted = async (event)=>{
    console.log(event, 'delete post')
    const {postId, mediaIds} = event
    try {
        const mediaToDelete = await Media.find({ _id : {$in : mediaIds}})
        for (const media of mediaToDelete){
            await deleteMediaFromCloudinery(media.publicId)
            await Media.findByIdAndDelete(media._id)

            logger.info(` Deleted media ${media._id} associated with this post id :  ${postId}`)
        }
        logger.info(`Process of Deleting medai is completed post id ${postId}`)
        
    } catch (error) {
        logger.error('Error while delete media using delete event' ,error)
    }
}

module.exports = {handlePostDeleted}