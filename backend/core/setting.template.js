const setting = {
	AppName: 'Ritchko Template',
	hostName: 'https://example.com',
	
	port: 80,

	isProduction: false,

	mysql: {
        'database1': { //alias
		    host: 'db1.server.host',
		    user: 'dbUser1',
		    password: 'dbPass1',
			database: 'DBName'
	    },
        'database2': { //alias
		    host: 'db2.server.host',
		    user: 'dbUser2',
		    password: 'dbPass2',
			database: 'DBName'
	    }
	},
	sqlCamelToSnakeMapping: false,

	s3: {
        accessKeyId: 's3 accessKeyId',
        secretAccessKey: 's3 secretAccessKey',
		region: 'ap-northeast-1',
		endpoint: ''
    },

	fileUpload: {
		limitSize: 5 * 1000 * 1000, // 5mb
		tempBucket: 'upload-temp',		
	},

	gmailSmtp: {
		user: 'user@gmail.com',
		fromEmail: 'custom-user@gmail.com',
		clientId: 'google-api-clientId.apps.googleusercontent.com',
		clientSecret: 'google-api-clientSecret',
		accessToken: 'aa00.access_token',
		refreshToken: '1//refresh-token',
		fromEmail: 'user@gmail.com'
	},

	encrypt: {
		key: 'encryptkeyString',
	},

	redis: {
		host: 'localhost',
		port: 6379,
		password: 'redisPassword',
	},

	token: {
		enableTimeExpire: false, // false for local mode
		accessTokenExpire: 15 * 60, //s (15 minutes)
		refreshTokenExpire: 14 * 24 * 60 * 60, //s (14 days)
	},

	socket: {
		redisAdapter: {
			enable: false,
			redis: {
				host: 'localhost',
				port: 6379,
				password: 'redisPassword',
			},
		}
	},
}

module.exports = setting;