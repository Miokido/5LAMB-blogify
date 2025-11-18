// src/handlers/createPost.js
const { ddb } = require("../lib/dynamo.js");
const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const { requireAuth } = require("../lib/auth.js");

// Seuls les rôles admin et editor peuvent créer un post
const handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');

        if (!body.title) {
            return { statusCode: 400, body: JSON.stringify({ error: 'title is required' }) };
        }

        const now = new Date().toISOString();
        const postId = uuidv4();

        const item = {
            PK: `POST#${postId}`,
            SK: `META#${postId}`,
            postId,
            title: body.title,
            slug: body.slug || `post-${postId.slice(0,8)}`,
            body: body.body || '',
            excerpt: body.excerpt || '',
            status: body.status || 'draft',
            authorId: event.user.sub, // injecté par requireAuth
            tags: body.tags || [],
            media: body.media || [],
            createdAt: now,
            updatedAt: now
        };

        await ddb.send(new PutCommand({
            TableName: process.env.POSTS_TABLE,
            Item: item
        }));

        return { statusCode: 201, body: JSON.stringify({ postId }) };

    } catch (err) {
        console.error("createPost error:", err);
        return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
    }
};

// wrapper requireAuth pour limiter aux rôles admin/editor
module.exports.handler = requireAuth(['admin','editor'])(handler);
