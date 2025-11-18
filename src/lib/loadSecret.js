const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

let cachedSecret = null;

module.exports.getJwtSecret = async () => {
    if (cachedSecret) return cachedSecret;

    const client = new SecretsManagerClient();
    const secretName = `blogify-${process.env.STAGE}-jwt-secret`;

    const secret = await client.send(
        new GetSecretValueCommand({
            SecretId: secretName
        })
    );

    const parsed = JSON.parse(secret.SecretString);
    cachedSecret = parsed.jwtSecret;
    return cachedSecret;
};
