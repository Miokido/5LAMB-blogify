const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("./loadSecret");

const verifyToken = async (token) => {
    if (!token) throw new Error("No token");
    const secret = await getJwtSecret();
    console.log("[auth] secret length:", secret.length, "sha256:", require('crypto').createHash('sha256').update(secret).digest('hex'));
    return jwt.verify(token, secret);
};

const requireAuth = (allowedRoles = []) => {
    return (handler) => async (event, context) => {
        console.log("requireAuth invoked", event.headers);
        console.log(await getJwtSecret());
        try {
            const authHeader = event.headers?.Authorization || event.headers?.authorization || "";
            const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
            if (!token) return { statusCode: 401, body: JSON.stringify({ error: "Missing token" }) };

            let payload;
            try {
                payload = await verifyToken(token);
            } catch (err) {
                return { statusCode: 401, body: JSON.stringify({ error: "Invalid token" }) };
            }

            if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
                return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
            }

            event.user = payload;
            return handler(event, context);

        } catch (err) {
            console.error("auth middleware error:", err);
            return { statusCode: 500, body: JSON.stringify({ error: "Internal Error" }) };
        }
    };
};

module.exports = { requireAuth };
