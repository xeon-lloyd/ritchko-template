const setting = {
	AppName: 'ritchko-template',
	hostName: 'https://example.com',
	appTimeZone: 'Z', // app timezone (cron, date...)
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
		limitSize: 5 * 1000 * 1000, // (bytes) 5mb
		tempBucket: 'upload-temp',
		uploadKeyExpire: 10 * 60, // (seconds) 10분
		rateLimit: {
			windowMs: 10 * 60 * 1000, // 10분
			max: 30, // windowMs당 최대 요청 수
		}
	},

	emailSmtp: {
		host: 'smtp.example.com', // SMTP 호스트
		port: 465, // SMTP 포트
		secure: true, // SMTP 프로토콜
		user: 'smtp-user', // SMTP 사용자 이름
		password: 'smtp-password', // SMTP 비밀번호
		fromEmail: 'noreply@example.com', // 발신 주소 (선택)
		replyTo: '', // 답장 주소 (선택)
	},

	errorReport: {
		enable: false,
		webhookUrl: '',
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
		maskParams: [
			'pw',
			'refreshToken',
		],
		maxParamLogLength: 500, // 요청 param 문자열 길이 제한 (0 for no limit)
		captureConsole: false, // console 출력 로깅 여부
	},

	rateLimit: {
		windowMs: 30 * 1000, // 30초
		limit: 250,          // windowMs당 최대 요청 수
	},
}

module.exports = setting;
