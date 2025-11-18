// src/lib/dynamo.js
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION
});

const ddb = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true }
});

module.exports = { ddb };
