const User = require('./../models/user')
const Post = require('./../models/post')
const bcrypt = require('bcrypt')
const validator = require('validator')
const jwt = require('jsonwebtoken')
const { ObjectId } = require('mongodb')

module.exports = {
    login: async function ({ email, password }) {
        try {
            const loadedUser = await User.findOne({ email })
            if (!loadedUser) {
                const error = new Error('A user with this email could not be found.');
                error.code = 401
                throw error
            }
            const isEqual = await bcrypt.compare(password, loadedUser.password);
            if (!isEqual) {
                const error = new Error('Wrong password!')
                error.statusCode = 401;
                throw error
            }
            const token = jwt.sign(
                {
                    email: loadedUser.email,
                    userId: loadedUser._id.toString()
                },
                process.env.APP_SECRET_KEY,
                { expiresIn: '1h' }
            )
            return {
                token,
                userId: loadedUser._id.toString(),
            }
        } catch (error) {
            throw new Error(error)
        }
    },

    createUser: async function (args, req) {
        const { email, name, password } = args.userInput
        const validatorErrors = []
        if (!validator.isEmail(email)) {
            validatorErrors.push({ message: "Email is invalid." })
        }
        if (validator.isEmpty(password) || !validator.isLength(password, { min: 6 })) {
            validatorErrors.push({ message: "Password is too short." })
        }
        if (validatorErrors.length > 0) {
            const validatorErr = new Error('Invalid input data.')
            validatorErr.code = 422
            validatorErr.data = validatorErrors
            throw validatorErr
        }

        const existingUser = await User.findOne({ email })
        if (existingUser) {
            const err = new Error('User exists already.')
            throw err
        }
        const hashedPw = await bcrypt.hash(password, 12)
        const user = new User({
            email: email,
            password: hashedPw,
            name: name
        })
        const createdUser = await user.save()
        return { ...createdUser._doc, _id: createdUser._id.toString() }
    },

    createPost: async function ({ postInput }, req) {
        if (!req.isAuth) {
            const err = new Error('Not authenticated.')
            err.code = 401
            throw err
        }
        const { title, content, imageUrl } = postInput
        const validatorErrors = []
        if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
            validatorErrors.push({ message: 'Title must be at least 5 characters' })
        }
        if (validator.isEmpty(content) || !validator.isLength(content, { min: 5 })) {
            validatorErrors.push({ message: 'Content must be at least 5 characters' })
        }
        if (validatorErrors.length > 0) {
            const validatorErr = new Error('Invalid input data.')
            validatorErr.code = 422
            validatorErr.data = validatorErrors
            throw validatorErr
        }

        const currentUser = await User.findById(req.userId)
        if (!currentUser) {
            const err = new Error('Invalid user.')
            err.code = 401
            throw err
        }
        const post = new Post({ title, content, imageUrl, creator: currentUser })
        const newPost = await post.save()
        currentUser.posts.push(newPost)
        await currentUser.save()
        return {
            ...newPost._doc,
            _id: newPost._id.toString(),
            createdAt: newPost.createdAt.toUTCString(),
            updatedAt: newPost.updatedAt.toUTCString()
        }
    },

    posts: async function ({ page }, req) {
        if (!req.isAuth) {
            const err = new Error('Not authenticated.')
            err.code = 401
            throw err
        }
        
        const limit = 2 
        const posts = await Post
            .find()
            .sort({ createdAt: -1 })
            .skip((page -1) * limit)
            .limit(limit)
            .populate('creator')

        const totalPosts = await Post.find().countDocuments()
        return {
            posts: posts.map(post => {
                return {
                    ...post._doc,
                    _id: post._id.toString(),
                    createdAt: post.createdAt.toUTCString(),
                    updatedAt: post.updatedAt.toUTCString()
                }
            }),
            totalPosts: totalPosts
        }
    }
}
