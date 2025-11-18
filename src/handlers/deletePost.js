// src/handlers/deletePost.js
const { ddb } = require("../lib/dynamo.js");
const { GetCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { requireAuth } = require("../lib/auth");

const handler = requireAuth(["admin", "editor"])(async (event) => {
    const { id } = event.pathParameters || {};
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: "missing id" }) };

    const key = { PK: `POST#${id}`, SK: `META#${id}` };
    const getRes = await ddb.send(new GetCommand({ TableName: process.env.POSTS_TABLE, Key: key }));
    if (!getRes.Item) return { statusCode: 404, body: JSON.stringify({ error: "Not found" }) };

    const post = getRes.Item;
    if (event.user.role === "editor" && event.user.sub !== post.authorId) {
        return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
    }

    await ddb.send(new DeleteCommand({ TableName: process.env.POSTS_TABLE, Key: key }));
    return { statusCode: 204, body: "" };
});

module.exports.handler = handler;
