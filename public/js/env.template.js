const env = {
    host: 'https://example.com',

    token: {
        rotateTokenOperation: 'RotateUserToken',
        accessTokenExpire: 15 * 60, //s (15 minutes)
        refreshTokenExpire: 14 * 24 * 60 * 60, //s (14 days)
        signOutOperation: 'SignOut',
    }
}