// src/handlers/updatePost.js
const { ddb } = require("../lib/dynamo.js");
const { GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { requireAuth } = require("../lib/auth");

const handler = requireAuth(["admin", "editor"])(async (event) => {
    const { id } = event.pathParameters || {};
    const body = JSON.parse(event.body || '{}');
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: "missing id" }) };

    // Récupérer le post pour vérifier l'auteur
    const key = { PK: `POST#${id}`, SK: `META#${id}` };
    const getRes = await ddb.send(new GetCommand({ TableName: process.env.POSTS_TABLE, Key: key }));
    if (!getRes.Item) return { statusCode: 404, body: JSON.stringify({ error: "Not found" }) };

    const post = getRes.Item;

    // Editor ne peut modifier que ses posts
    if (event.user.role === "editor" && event.user.sub !== post.authorId) {
        return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
    }

    const now = new Date().toISOString();
    const updateExpr = [];
    const exprAttrNames = {};
    const exprAttrValues = {};

    if (body.title) { updateExpr.push('#t = :t'); exprAttrNames['#t'] = 'title'; exprAttrValues[':t'] = body.title; }
    if (body.body) { updateExpr.push('#b = :b'); exprAttrNames['#b'] = 'body'; exprAttrValues[':b'] = body.body; }
    if (body.status) { updateExpr.push('#s = :s'); exprAttrNames['#s'] = 'status'; exprAttrValues[':s'] = body.status; }
    updateExpr.push('#u = :u'); exprAttrNames['#u'] = 'updatedAt'; exprAttrValues[':u'] = now;

    const res = await ddb.send(new UpdateCommand({
        TableName: process.env.POSTS_TABLE,
        Key: key,
        UpdateExpression: 'SET ' + updateExpr.join(', '),
        ExpressionAttributeNames: exprAttrNames,
        ExpressionAttributeValues: exprAttrValues,
        ReturnValues: 'ALL_NEW'
    }));

    return { statusCode: 200, body: JSON.stringify(res.Attributes) };
});

module.exports.handler = handler;
