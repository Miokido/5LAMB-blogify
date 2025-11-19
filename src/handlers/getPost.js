const { ddb } = require("../lib/dynamo.js");
const { GetCommand } = require("@aws-sdk/lib-dynamodb");

module.exports.handler = async (event) => {
    const { id } = event.pathParameters || {};
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: "missing id" }) };

    const key = { PK: `POST#${id}`, SK: `META#${id}` };
    const res = await ddb.send(new GetCommand({ TableName: process.env.POSTS_TABLE, Key: key }));
    if (!res.Item) return { statusCode: 404, body: JSON.stringify({ error: "Not found" }) };

    return { statusCode: 200, body: JSON.stringify(res.Item) };
};
