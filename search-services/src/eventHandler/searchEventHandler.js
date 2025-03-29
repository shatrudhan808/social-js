const Search = require("../models/search.model")

const handlePostCreation = async (event) => {
    try {
        const newSearchPost = new Search({
            postId : event.postId,
            userid : event.userid,
            content : event.content,
            createdAt : event.createdAt
        })
       await newSearchPost.save()
        logger.info(` Search post Created  with this post id :  ${event.postId}`)
        
    } catch (error) {
        logger.error('Error while createing post  event' ,error)
    }
}
const handlePostDeleted = async (event) =>{
    try {
        await Search.findOneAndDelete({postId : event.postId})
        logger.info(`Search post deleted post  : ${event.postId}`)
        
    } catch (error) {
        logger.error('Error while delte  post from Search service  event' ,error)
    }
}

module.exports = {handlePostCreation, handlePostDeleted}