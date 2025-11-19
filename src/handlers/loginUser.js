const { ddb } = require("../lib/dynamo.js");
const { QueryCommand } = require("@aws-sdk/lib-dynamodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

let cachedJwtSecret = null;

async function loadJwtSecret() {
    if (cachedJwtSecret) return cachedJwtSecret;

    const client = new SecretsManagerClient();
    const secretName = `blogify-${process.env.STAGE}-jwt-secret`;

    const secret = await client.send(
        new GetSecretValueCommand({ SecretId: secretName })
    );

    const parsed = JSON.parse(secret.SecretString);
    cachedJwtSecret = parsed.jwtSecret;

    return cachedJwtSecret;
}

module.exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body || "{}");
        const { email, password } = body;

        if (!email || !password) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Email and password required" })
            };
        }

        const queryRes = await ddb.send(new QueryCommand({
            TableName: process.env.USERS_TABLE,
            IndexName: "EmailIndex",
            KeyConditionExpression: "email = :email",
            ExpressionAttributeValues: { ":email": email }
        }));

        if (queryRes.Count === 0) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: "Invalid credentials" })
            };
        }

        const user = queryRes.Items[0];

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: "Invalid credentials" })
            };
        }

        const payload = {
            sub: user.userId,
            email: user.email,
            role: user.role
        };

        const secret = await loadJwtSecret();
        const token = jwt.sign(payload, secret, { expiresIn: "7d" });

        return {
            statusCode: 200,
            body: JSON.stringify({ token, user: payload })
        };

    } catch (err) {
        console.error("loginUser error:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Error" })
        };
    }
};
