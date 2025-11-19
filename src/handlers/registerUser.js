const { ddb } = require("../lib/dynamo.js");
const { PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

module.exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body || "{}");
        const { email, password, role } = body;

        if (!email || !password) {
            return { statusCode: 400, body: JSON.stringify({ error: "Email and password required" }) };
        }

        const queryRes = await ddb.send(new QueryCommand({
            TableName: process.env.USERS_TABLE,
            IndexName: "EmailIndex",
            KeyConditionExpression: "email = :email",
            ExpressionAttributeValues: { ":email": email }
        }));

        if (queryRes.Count > 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "Email already registered" }) };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        const item = {
            userId,
            email,
            passwordHash: hashedPassword,
            role: role || "guest",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await ddb.send(new PutCommand({
            TableName: process.env.USERS_TABLE,
            Item: item
        }));

        return { statusCode: 201, body: JSON.stringify({ userId, email, role: item.role }) };

    } catch (err) {
        console.error("registerUser error:", err);
        return { statusCode: 500, body: JSON.stringify({ error: "Internal Error" }) };
    }
};
