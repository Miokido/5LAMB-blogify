const { ddb } = require("../lib/dynamo.js");
const { ScanCommand } = require("@aws-sdk/lib-dynamodb");

module.exports.handler = async (event) => {
    const limit = event.queryStringParameters?.limit ? parseInt(event.queryStringParameters.limit) : 20;

    const scanRes = await ddb.send(new ScanCommand({
        TableName: process.env.POSTS_TABLE,
        Limit: limit
    }));

    return { statusCode: 200, body: JSON.stringify({ items: scanRes.Items || [] }) };
};
