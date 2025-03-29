
const RefreshToken = require('../models/refreshToken.model')
const User = require('../models/user.model')
const generateTokens = require('../utils/generateTokens')
const logger = require('../utils/logger')
const {validateRegistration, validateLogin} = require('../utils/validation')
// user registration

const registerUser = async (req, res) => {
    logger.info('Registration end point hit ...')
    try {
        // validate the schema
        const {error} = validateRegistration(req.body)
        if(error){
            logger.warn('Validation error', error.details[0].message)
            return res.status(400).json({
                success : false,
                message : error.details[0].message
            })
        }
        const {username, email, password} = req.body

        let user = await User.findOne({
            $or : [{email},{username}]
        })
        if(user){
            logger.warn('User already exists')
            return res.status(400).json({
                success : false,
                message :'User already exists | please try with another email and username'
            })
        }
        user = new User({username, email, password})
        await user.save()
        logger.warn('User Saved successfully', user._id)

        const {accessToken, refreshToken} = await generateTokens(user)
        res.status(201).json({
            success : true,
            message : 'User Registered successfully !',
            accessToken,
            refreshToken
        })

        
    } catch (error) {
        logger.error('Registration error occured', error)
        res.status(500).json({
            success : false,
            message : 'Internal server error'
        })
    }
}


// user login
const loginUser = async (req, res) => {
    logger.info('Login end point hit ...')
    try {
        const {error} = validateLogin(req.body)
        if(error){
            logger.warn('login error', error.details[0].message)
            return res.status(400).json({
                success : false,
                message : error.details[0].message
            })
        }
        const {email, password} = req.body
        const user = await User.findOne({email})
        if(!user){
            logger.warn('Invalid user credentials')
            return res.status(400).json({
                success : false,
                message : 'Invalid user credentials'
            })
        }
        // password is valid or not
        const isValidPassword = await user.comparePassword(password)
        if(!isValidPassword){
            logger.warn('Invalid user password')
            return res.status(400).json({
                success : false,
                message : 'Invalid user password'
            })
        }
        // generate access and refresh token
        const {accessToken, refreshToken} = await generateTokens(user)
        res.json({
            success : true,
            message : 'login success',
            _id : user._id,
            accessToken: accessToken,
            refreshToken : refreshToken
        })
    } catch (error) {
        logger.error('Login error occured', error)
        res.status(500).json({
            success : false,
            message : 'Internal server error'
        })
    }
    
}


// refresh Token
const refreshTokenUser = async (req, res) => {
    logger.info('Refresh Token end point hit ...')
    try {
        const {refreshToken} = req.body
        if(!refreshToken){
            logger.warn('Refresh token missing')
            return res.status(400).json({
                success : false,
                message : 'Refresh token missing'
            }) 
        }
        const storeToken = await RefreshToken.findOne({token : refreshToken})
        if(!storeToken || storeToken.expiresAt < new Date()){
            logger.warn('Invalid or Expired refresh token')
            return res.status(401).json({
                success : false,
                message : 'Invalid or Expired refresh token'
            }) 
        }
        const user = await User.findById(storeToken.user)
        if(!user){
            logger.warn('User not found')
            return res.status(401).json({
                success : false,
                message : 'User not found'
            })
        }

        const {accessToken : newAccessToken, refreshToken : newRefreshToken} = await generateTokens(user)
        // delete the old refresh token
        await RefreshToken.deleteOne({_id: storeToken._id})
        res.json({
            accessToken : newAccessToken, refreshToken : newRefreshToken
        })
        
    } catch (error) {
        logger.error('Refresh Token error occured', error)
        res.status(500).json({
            success : false,
            message : 'Internal server error'
        }) 
    }
}

// logout

const logoutUser = async (req, res) => {
    logger.info('Logout end point hit ...')
    try {
        const {refreshToken} = req.body
        if(!refreshToken){
            logger.warn('Refresh token missing')
            return res.status(400).json({
                success : false,
                message : 'Refresh token missing'
            }) 
        }
        await RefreshToken.deleteOne({token : refreshToken})
        logger.info('Refresh Token Deleted for logout')
        res.json({
            success : true,
            message : 'logged out successfully !'
        })
        
    } catch (error) {
        logger.error('Logout error occured', error)
        res.status(500).json({
            success : false,
            message : 'Internal server error'
        })
    }

}


module.exports = {registerUser, loginUser, refreshTokenUser, logoutUser}

