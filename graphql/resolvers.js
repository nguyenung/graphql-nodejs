const User = require('./../models/user')
const bcrypt = require('bcrypt')
const validator = require('validator')
const jwt = require('jsonwebtoken')

module.exports = {
    login: async function ({email, password}) {
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
    }
}