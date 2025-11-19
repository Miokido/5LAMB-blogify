const { ddb } = require("../lib/dynamo.js");
const { GetCommand } = require("@aws-sdk/lib-dynamodb");
const {requireAuth} = require("../lib/auth");

module.exports.handler = requireAuth(["admin", "editor", "guest"]) (async (event) => {
    const { id } = event.pathParameters || {};
    if (!id) {
        return { statusCode: 400, body: JSON.stringify({ error: "missing id" }) };
    }

    const claims = event.requestContext?.authorizer?.claims || null;
    const role = claims?.role || "guest";
    const userId = claims?.sub || null;

    const key = { PK: `POST#${id}`, SK: `META#${id}` };
    const res = await ddb.send(new GetCommand({
        TableName: process.env.POSTS_TABLE,
        Key: key,
    }));

    const post = res.Item;
    if (!post) {
        return { statusCode: 404, body: JSON.stringify({ error: "Not found" }) };
    }

    const status = post.status;
    const authorId = post.authorId;

    if (role === "admin") {
        return { statusCode: 200, body: JSON.stringify(post) };
    }

    if (role === "editor") {
        if (status === "published") {
            return { statusCode: 200, body: JSON.stringify(post) };
        }
        if (status === "draft" && userId === authorId) {
            return { statusCode: 200, body: JSON.stringify(post) };
        }
        return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
    }

    if (role === "guest" || !claims) {
        if (status === "published") {
            return { statusCode: 200, body: JSON.stringify(post) };
        }
        return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
    }

    return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
});
