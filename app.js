const express = require('express')
const mongoose = require('mongoose')
const { graphqlHTTP } = require('express-graphql')
const graphqlSchema = require('./graphql/schema')
const graphqlResolver = require('./graphql/resolvers')

const { loadEnvironmentVariables } = require('./config/env')
loadEnvironmentVariables()

const app = express()

app.use('/graphql', graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
}))

async function connectToMongoDB() {
    try {
        await mongoose.connect(process.env.DB_MONGODB_CREDENTIAL);
        console.log('Connected to MongoDB through mongoose');
    } catch (error) {
        throw new Error(error.message);
    }
}

connectToMongoDB()

app.listen(3000)