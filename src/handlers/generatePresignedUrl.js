// src/handlers/generatePresignedUrl.js
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { requireAuth } = require("../lib/auth");

const s3 = new S3Client({});

const handler = requireAuth(["admin", "editor"])(async (event) => {
    const body = JSON.parse(event.body || '{}');
    const { filename, contentType, expiresIn } = body;
    if (!filename) return { statusCode: 400, body: JSON.stringify({ error: "filename required" }) };

    const key = `uploads/${Date.now()}_${filename.replace(/\s+/g,'_')}`;
    const putCmd = new PutObjectCommand({
        Bucket: process.env.MEDIA_BUCKET,
        Key: key,
        ContentType: contentType || "application/octet-stream",
    });

    const expiry = Number(expiresIn) > 0 ? Math.min(Number(expiresIn), 3600) : 300;
    const uploadUrl = await getSignedUrl(s3, putCmd, { expiresIn: expiry });

    return { statusCode: 200, body: JSON.stringify({ uploadUrl, key, expiresIn: expiry }) };
});

module.exports.handler = handler;
