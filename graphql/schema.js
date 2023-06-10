const { buildSchema } = require('graphql')

module.exports = buildSchema(`
    type TestData {
        text: String!
        views: Int!
    }

    type BelloData {
        name: Int!
    }

    type RootQuery {
        hello: TestData
        bello: BelloData
    }

    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }

    type User {
        _id: ID!
        email: String!
        name: String!
        password: String
        status: String!
        posts: [Post!]!
    }

    input UserInputData {
        email: String!
        name: String!
        password: String!
    }

    type RootMutation {
        createUser(userInput: UserInputData): User!
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`)