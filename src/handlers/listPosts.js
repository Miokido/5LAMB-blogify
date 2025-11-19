const { ddb } = require("../lib/dynamo.js");
const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
const {requireAuth} = require("../lib/auth");

module.exports.handler = requireAuth(["admin", "editor", "guest"]) (async (event) => {
    const limit = event.queryStringParameters?.limit
        ? parseInt(event.queryStringParameters.limit)
        : 20;

    const role = event.user.role || "guest";
    const userId = event.user.sub || null;

    const scanRes = await ddb.send(new ScanCommand({
        TableName: process.env.POSTS_TABLE,
        Limit: limit,
    }));

    const items = scanRes.Items || [];

    let filtered = [];

    if (role === "admin") {
        filtered = items;
    } else if (role === "editor") {
        filtered = items.filter(post =>
            post.status === "published" ||
            (post.status === "draft" && post.authorId === userId)
        );
    } else {
        filtered = items.filter(post => post.status === "published");
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ items: filtered })
    };
});
