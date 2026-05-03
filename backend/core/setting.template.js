const setting = {
	AppName: 'ritchko-template',
	hostName: 'https://example.com',
	pm2InstanceCount: 0,
	
	port: 80,

	isProduction: false,

	mysql: {
        'database1': { //alias
		    host: 'db1.server.host',
		    user: 'dbUser1',
		    password: 'dbPass1',
			database: 'DBName',
			connectionLimit: 10,
			timezone: 'Z'
	    },
        'database2': { //alias
		    host: 'db2.server.host',
		    user: 'dbUser2',
		    password: 'dbPass2',
			database: 'DBName',
			connectionLimit: 10,
			timezone: 'Z'
	    }
	},
	sqlCamelToSnakeMapping: false,

	s3: {
        accessKeyId: 's3 accessKeyId',
        secretAccessKey: 's3 secretAccessKey',
		region: 'ap-northeast-1',
		endpoint: '',
		buckets: {
			myBucket: 'my-bucket-name',
		}
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

	// 필수 설정 (token, worker dependency)
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

	// s3 사전 설정 및 초기화 필수
	logging: {
		uploadBucket: 'log-bucket',
		uploadKeyPrefix: 'api_prod',
		rotateInterval: '1d', // 1h, 3h, 6h, 12h, 1d
		maskParams: [
			'pw',
			'refreshToken',
		],
		maxParamLogLength: 500, // 요청 param 문자열 길이 제한 (0 for no limit)
		captureConsole: false, // console 출력 로깅 여부
	}
}

module.exports = setting;
