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
		refreshToken: '1//refresh-token'
	},

	encrypt: {
		key: 'encryptkeyString',
	},

	token: {
		enableTimeExpire: false,
		expire: 3 * 24 * 60 * 60 //s
	}
}

module.exports = setting;