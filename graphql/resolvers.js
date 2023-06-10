const User = require('./../models/user')
const bcrypt = require('bcrypt')
const validator = require('validator')

module.exports = {
    hello() {
        return {
            text: 'Hello, world!',
            views: 55
        }
    },

    bello() {
        return {
            name: 'Ung Nguyen'
        }
    },

    createUser: async function(args, req) {
        const {email, name , password} = args.userInput
        const validatorErrors = []
        if (!validator.isEmail(email)) {
            validatorErrors.push({message: "Email is invalid."})
        }
        if (validator.isEmpty(password) || !validator.isLength(password, {min: 6})) {
            validatorErrors.push({message: "Password is too short."})
        }
        if (validatorErrors.length > 0) {
            const validatorErr = new Error('Invalid input data.')
            validatorErr.code = 422
            validatorErr.data = validatorErrors
            throw validatorErr
        }

        const existingUser = await User.findOne({email})
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
        return {...createdUser._doc, _id: createdUser._id.toString()}
    }
}