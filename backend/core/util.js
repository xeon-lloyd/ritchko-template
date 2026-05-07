const fs = require('fs').promises;
const crypto = require('crypto');
const redis = require('redis')
const setting = require(`./setting.js`);

module.exports = {
	/* DB(mysql) 관련 */
	mysql: {
		/* DB 연결 */
		connection: {},
		connect: function(db){
			if(!setting.mysql[db]) throw new Error(`mysql alias not found: ${db}`);
			if(this.connection[db]) return this.connection[db];

			setting.mysql[db].enableKeepAlive = true;
			if(setting.mysql[db].waitForConnections == undefined) setting.mysql[db].waitForConnections = true;
			if(setting.mysql[db].queueLimit == undefined) setting.mysql[db].queueLimit = 0;
			setting.mysql[db].connectionLimit = setting.mysql[db].connectionLimit || 10;
			setting.mysql[db].timezone = setting.mysql[db].timezone || 'Z';

			const mysql = require('mysql2/promise');
			this.connection[db] = mysql.createPool(setting.mysql[db]);;
			return this.connection[db];
		},

		camelToSnake: str => {
			if (!setting.sqlCamelToSnakeMapping) return str;
		
			// MySQL 8.0 예약어 및 함수 목록
			const sqlKeywords = new Set([
				// 예약어
				'ACCESSIBLE', 'ADD', 'ALL', 'ALTER', 'ANALYZE', 'AND', 'AS', 'ASC', 'ASENSITIVE',
				'BEFORE', 'BETWEEN', 'BIGINT', 'BINARY', 'BLOB', 'BOTH', 'BY', 'CALL', 'CASCADE', 
				'CASE', 'CHANGE', 'CHAR', 'CHARACTER', 'CHECK', 'COLLATE', 'COLUMN', 'CONDITION', 
				'CONSTRAINT', 'CONTINUE', 'CONVERT', 'CREATE', 'CROSS', 'CUBE', 'CUME_DIST', 
				'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'CURRENT_USER', 'CURSOR', 
				'DATABASE', 'DATABASES', 'DAY_HOUR', 'DAY_MICROSECOND', 'DAY_MINUTE', 
				'DAY_SECOND', 'DEC', 'DECIMAL', 'DECLARE', 'DEFAULT', 'DELAYED', 'DELETE', 
				'DENSE_RANK', 'DESC', 'DESCRIBE', 'DETERMINISTIC', 'DISTINCT', 'DISTINCTROW', 
				'DIV', 'DOUBLE', 'DROP', 'DUAL', 'EACH', 'ELSE', 'ELSEIF', 'EMPTY', 'ENCLOSED', 
				'ESCAPED', 'EXCEPT', 'EXISTS', 'EXIT', 'EXPLAIN', 'FALSE', 'FETCH', 'FIRST_VALUE', 
				'FLOAT', 'FLOAT4', 'FLOAT8', 'FOR', 'FORCE', 'FOREIGN', 'FROM', 'FULLTEXT', 
				'FUNCTION', 'GENERATED', 'GET', 'GRANT', 'GROUP', 'GROUPING', 'GROUPS', 'HAVING', 
				'HIGH_PRIORITY', 'HOUR_MICROSECOND', 'HOUR_MINUTE', 'HOUR_SECOND', 'IF', 
				'IGNORE', 'IN', 'INDEX', 'INFILE', 'INNER', 'INOUT', 'INSENSITIVE', 'INSERT', 
				'INT', 'INT1', 'INT2', 'INT3', 'INT4', 'INT8', 'INTEGER', 'INTERVAL', 'INTO', 
				'IO_AFTER_GTIDS', 'IO_BEFORE_GTIDS', 'IS', 'ITERATE', 'JOIN', 'JSON_TABLE', 'KEY', 
				'KEYS', 'KILL', 'LAG', 'LAST_VALUE', 'LATERAL', 'LEAD', 'LEADING', 'LEAVE', 
				'LEFT', 'LIKE', 'LIMIT', 'LINEAR', 'LINES', 'LOAD', 'LOCALTIME', 'LOCALTIMESTAMP', 
				'LOCK', 'LONG', 'LONGBLOB', 'LONGTEXT', 'LOOP', 'LOW_PRIORITY', 'MASTER_BIND', 
				'MASTER_SSL_VERIFY_SERVER_CERT', 'MATCH', 'MAXVALUE', 'MEDIUMBLOB', 'MEDIUMINT', 
				'MEDIUMTEXT', 'MEMBER', 'MIDDLEINT', 'MINUTE_MICROSECOND', 'MINUTE_SECOND', 
				'MOD', 'MODIFIES', 'NATURAL', 'NOT', 'NO_WRITE_TO_BINLOG', 'NTH_VALUE', 
				'NTILE', 'NULL', 'NUMERIC', 'OF', 'ON', 'ONLY', 'OPTIMIZE', 'OPTIMIZER_COSTS', 
				'OPTION', 'OPTIONALLY', 'OR', 'ORDER', 'OUT', 'OUTER', 'OUTFILE', 'OVER', 
				'PARTITION', 'PERCENT_RANK', 'PRECISION', 'PRIMARY', 'PROCEDURE', 'PURGE', 
				'RANGE', 'RANK', 'READ', 'READS', 'READ_WRITE', 'REAL', 'RECURSIVE', 'REFERENCES', 
				'REGEXP', 'RELEASE', 'RENAME', 'REPEAT', 'REPLACE', 'REQUIRE', 'RESIGNAL', 
				'RESTRICT', 'RETURN', 'REVOKE', 'RIGHT', 'RLIKE', 'ROW', 'ROWS', 'ROW_NUMBER', 
				'SCHEMA', 'SCHEMAS', 'SECOND_MICROSECOND', 'SELECT', 'SENSITIVE', 'SEPARATOR', 
				'SET', 'SHOW', 'SIGNAL', 'SMALLINT', 'SPATIAL', 'SPECIFIC', 'SQL', 
				'SQLEXCEPTION', 'SQLSTATE', 'SQLWARNING', 'SQL_BIG_RESULT', 'SQL_CALC_FOUND_ROWS', 
				'SQL_SMALL_RESULT', 'SSL', 'STARTING', 'STORED', 'STRAIGHT_JOIN', 'SYSTEM', 
				'TABLE', 'TERMINATED', 'THEN', 'TINYBLOB', 'TINYINT', 'TINYTEXT', 'TO', 'TRAILING', 
				'TRIGGER', 'TRUE', 'UNDO', 'UNION', 'UNIQUE', 'UNLOCK', 'UNSIGNED', 'UPDATE', 
				'USAGE', 'USE', 'USING', 'UTC_DATE', 'UTC_TIME', 'UTC_TIMESTAMP', 'VALUES', 
				'VARBINARY', 'VARCHAR', 'VARCHARACTER', 'VARYING', 'VIRTUAL', 'WHEN', 'WHERE', 
				'WHILE', 'WINDOW', 'WITH', 'WRITE', 'XOR', 'YEAR_MONTH', 'ZEROFILL',
				// 함수
				'AVG', 'COUNT', 'SUM', 'MIN', 'MAX', 'ROUND', 'CEIL', 'FLOOR', 'ABS', 'RAND',
				'NOW', 'CURDATE', 'CURTIME', 'DATE', 'DATEDIFF', 'DATE_ADD', 'DATE_SUB', 
				'DAY', 'MONTH', 'YEAR', 'WEEK', 'HOUR', 'MINUTE', 'SECOND'
			]);
		
			// 상태 관리: "AS" 뒤, SELECT 리스트 별칭 보호
			let skipNext = false;

			return str.split(/(\s+|[=,;*()])/).map((part, index, parts) => {
				// SQL 키워드와 특수문자, 공백은 그대로 반환
				if (sqlKeywords.has(part.toUpperCase()) || /^[=,;*()]+$/.test(part) || /^\s+$/.test(part)) {
					if (part.toUpperCase() === 'AS') {
						skipNext = true; // "AS" 뒤 별칭 보호 시작
					}
					return part;
				}
		
				// SELECT 리스트에서 별칭 보호: ',' 또는 'FROM' 전까지
				if (skipNext || (index > 0 && parts[index - 1].toUpperCase() === 'AS')) {
					skipNext = false; // 별칭 보호 종료
					return part; // 변환하지 않음
				}
		
				// 일반 문자열만 camelCase -> snake_case 변환
				return part
					.replace(/([A-Z])/g, letter => `_${letter.toLowerCase()}`)
					.replace(/^_/, ''); // 앞에 붙은 _ 제거
			}).join('');
		},
		
		snakeToCamel: str => setting.sqlCamelToSnakeMapping?str.toLowerCase().replace(/([_][a-z])/g, group => group.toUpperCase().replace('_', '')):str,

		/* select 실행 */
		select: async function(db, select, table, where='', params=[], orderBy='', limit=''){
			let sql = `SELECT ${this.camelToSnake(select)} FROM ${this.camelToSnake(table)}`;
			if(where!='') sql += ` WHERE ${this.camelToSnake(where)}`;
			if(orderBy!='') sql += ` ORDER BY ${this.camelToSnake(orderBy)}`;
			if(limit!='') sql += ` LIMIT ${limit}`;

			let [result] = await this.connection[db].query(sql, params);

			result = result.map(ele=>{
				let newObj = {};
				let keys = Object.keys(ele);
				for(i=0; i<keys.length; i++){
					newObj[this.snakeToCamel(keys[i])] = ele[keys[i]]
				}

				return newObj
			})
			
			return result;
		},

		/* insert 실행 */
		insert: async function(db, table, data){
			let keys = Object.keys(data);
			let params = [];
			let setter = '(';
			let value = 'VALUES('
			for(let i=0;i<keys.length;i++){
				setter += `\`${this.camelToSnake(keys[i])}\`, `;
				value += `?, `;
				params.push(data[keys[i]]);
			}

			setter = setter.substr(0, setter.length-2)+')';
			value = value.substr(0, value.length-2)+')';

			let sql = `INSERT INTO ${this.camelToSnake(table)} ${setter} ${value}`;

			let [result] = await this.connection[db].query(sql, params);

			return result;
		},

		insertMany: async function(db, table, name, data){
			let sql = `INSERT INTO ${this.camelToSnake(table)} (${this.camelToSnake(name)}) VALUES ?`;

			try{
				let [result] = await this.connection[db].query(sql, [data]);
			}catch(e){
				console.log(e)
			}
		},

		/* update 실행 */
		update: async function(db, table, data, where, Wparams){
			let keys = Object.keys(data);
			let params = [];
			let setter = 'SET ';
			for(let i=0;i<keys.length;i++){
				setter += `\`${this.camelToSnake(keys[i])}\` = ?, `;
				params.push(data[keys[i]]);
			}

			setter = setter.substr(0, setter.length-2);

			let sql = `UPDATE ${this.camelToSnake(table)} ${setter} WHERE ${this.camelToSnake(where)}`;

			if(Wparams!=undefined) params = params.concat(Wparams);
			
			let [result] = await this.connection[db].query(sql, params);

			return result;
		},

		/* delete 실행 */
		delete: async function(db, table, where='', params){
			let sql = `DELETE FROM ${this.camelToSnake(table)}`;
			if(where!='') sql += ` WHERE ${this.camelToSnake(where)}`;
			
			let [result] = await this.connection[db].query(sql, params);

			return result;
		},

		/* 조건 count */
		count: async function(db, table, where='', params){
			let sql = `SELECT COUNT(*) as result FROM ${this.camelToSnake(table)}`;
			if(where!='') sql += ` WHERE ${this.camelToSnake(where)}`;

			let [result] = await this.connection[db].query(sql, params);

			return parseInt(result[0].result);
		},

		/* 조건 합계 */
		sum: async function(db, select, table, where='', params){
			let sql = `SELECT SUM(${this.camelToSnake(select)}) as result FROM ${this.camelToSnake(table)}`;
			if(where!='') sql += ` WHERE ${this.camelToSnake(where)}`;

			let [result] = await this.connection[db].query(sql, params);

			return parseFloat(result[0].result) || 0;
		},

		/* sql 실행 */
		exec: async function(db, sql, params){
			let [result] = await this.connection[db].query(sql, params);

			return result;
		}
	},

	/* 암호화 관련 */
	encrypt: {
		/* 단방향 암호화 */
		oneWay: function(plainText){
			return crypto.createHmac('sha512', setting.encrypt.key).update(plainText).digest('hex');
		},

		oneWayLite: function(plainText){
			return crypto.createHmac('sha256', setting.encrypt.key).update(plainText).digest('hex');
		},

		shortHash: function(plainText, len){
			return crypto.createHash('shake256', { outputLength: len }).update(plainText).digest('hex');
		},

		/* 양방향 암호화 */
		encode: function(plainText){
			let iv = crypto.randomBytes(16);
			let key = crypto.createHash('sha256').update(setting.encrypt.key).digest().slice(0, 16);
			let cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
			let encrypted = cipher.update(plainText);
			let finalBuffer = Buffer.concat([encrypted, cipher.final()]);
			let encoded = iv.toString('hex') + ':' + finalBuffer.toString('hex');

			return encoded;
		},

		/* 양방향 복호화 */
		decode: function(encoded){
			let encryptedArray = encoded.split(':');
			let iv = new Buffer.from(encryptedArray[0], 'hex');
			let encrypted = new Buffer.from(encryptedArray[1], 'hex');
			let key = crypto.createHash('sha256').update(setting.encrypt.key).digest().slice(0, 16);
			let decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
			let decrypted = decipher.update(encrypted);
			let plainText = Buffer.concat([decrypted, decipher.final()]).toString();

			return plainText;
		}
	},

	/* 사용자 토큰 */
	token: {
		generateAccessToken: function(userData){
			userData._tokenCreateAt = new Date().getTime()
			
			let payload = Buffer.from(JSON.stringify(userData)).toString('base64url')
			let hash = module.exports.encrypt.oneWayLite(payload)
			return `${payload}.${hash}`;
		},

		generateRefreshToken: async function(userData){
			let key = ''
			let token = ''
			let isKeyExist = false
			do{
				token = crypto.randomBytes(32).toString('hex')
				key = `sys:RT:${token}`
				isKeyExist = ((await module.exports.redis.get(key)) != null)
			}while(isKeyExist)

			userData = JSON.stringify(userData)
			await module.exports.redis.set(key, userData, setting.token.refreshTokenExpire)

			return token
		},

		createInitialToken: async function(userData){
			let accessToken = this.generateAccessToken(userData);
			let refreshToken = await this.generateRefreshToken(userData);

			return {
				accessToken,
				refreshToken
			};
		},

		rotateTokenByRefreshToken: async function(refreshToken){
			const userDataString = await module.exports.redis.get(`sys:RT:${refreshToken}`);
			if(!userDataString) return null

			const userData = JSON.parse(userDataString);

			const accessToken = this.generateAccessToken(userData);
			const newRefreshToken = await this.generateRefreshToken(userData);
			await this.revokeRefreshToken(refreshToken);

			return {
				accessToken,
				refreshToken: newRefreshToken
			};
		},

		revokeRefreshToken: async function(refreshToken){
			await module.exports.redis.del(`sys:RT:${refreshToken}`);
		},
	},

	/* 메일 전송 관련 */
	mail: {
		/* 메일 전송 */
		send: function(mailOption){
			const nodemailer = require('nodemailer');

			return new Promise((resolve, reject) => {
				const transporter = nodemailer.createTransport({
					host: 'smtp.gmail.com',
					port: 465,
					secure: true,
					auth:{
						type: 'OAuth2',
						user: setting.gmailSmtp.user,
						clientId: setting.gmailSmtp.clientId,
						clientSecret: setting.gmailSmtp.clientSecret,
						refreshToken: setting.gmailSmtp.refreshToken,
					}
				});

				mailOption.from = setting.gmailSmtp.fromEmail;

				transporter.sendMail(mailOption, (error, info) => {
					resolve(info)
				});
			})
		}
	},

	/* aws s3 관련 */
	s3: {
		auth: null,
		setAuth: function(){
			const awsS3 = require("@aws-sdk/client-s3");

			const option = {
				region: setting.s3.region,
				credentials: {
					accessKeyId: setting.s3.accessKeyId,
					secretAccessKey: setting.s3.secretAccessKey,
				}
			};
			if(setting.s3.endpoint) option.endpoint = setting.s3.endpoint;

			this.auth = new awsS3.S3(option);
		},

		upload: async function(option){
			if(option.Body==undefined) option.Body = option.BodyRaw;
			else option.Body = await fs.readFile(option.Body);

			try{
				return this.auth.putObject(option);
			}catch(e){
				console.log(e)
				return;
			}	
		},

		download: async function(option){
			let data = await this.auth.getObject({   
				Bucket: option.Bucket,      
				Key: option.Key,
			});

			if(option.fileName==undefined) return data.Body.transformToString();
			else await fs.writeFile(option.fileName, data.Body);
		},

		copy: async function(option){
			/* {
				Bucket: "목적지 버킷",
				CopySource: encodeURI(`/${원본 버킷}/${파일명}`),
				Key: "목적지 파일명",
			} */
			await this.auth.copyObject(option)
		},

		delete: async function(option){
			/* {   
				Bucket: option.Bucket,      
				Key: option.Key,
			} */
			await this.auth.deleteObject(option);
		},

		headObject: async function(option){
			/* {   
				Bucket: option.Bucket,      
				Key: option.Key,
			} */
			let data = await this.auth.headObject(option);

			return data;
		},
	},

	fileUpload: {
		getFileInfo: async function(uploadKey){
			try{
				let fileInfo = await module.exports.s3.headObject({
					Bucket: setting.fileUpload.tempBucket,
					Key: uploadKey,
				});
	
				if(!fileInfo) return null;

				return fileInfo;
			}catch(e){
				return null
			}
		},

		checkFileSize: function(fileInfo){
			if(setting.fileUpload.limitSize < parseInt(fileInfo.ContentLength)) return false;
			return true;
		},

		moveTo: async function(uploadKey, bucket, key){
			try{
				await module.exports.s3.copy({
					Bucket: bucket,
					CopySource: encodeURI(`/${setting.fileUpload.tempBucket}/${uploadKey}`),
					Key: key,
				})
			}catch(e){
				throw new Error("유효하지 않은 Upload Key")
			}
		},

		toStream: async function(uploadKey){
			try{
				let data = await module.exports.s3.auth.getObject({   
					Bucket: setting.fileUpload.tempBucket,      
					Key: uploadKey,
				})

				return data.Body
			}catch(e){
				throw new Error("유효하지 않은 Upload Key")
			}
		},

		revokeUploadKey: async function(uploadKey){
			await module.exports.redis.del(`sys:fileUpload:${uploadKey}`);
		},
	},

	// redis 관련 기능 모음
	redis: {
		// [system] redis client
		client: null,
		pubClient: null,
		subClient: null,
		queueClient: null,

		// redis 초기화
		init: async function(){
			const options = {
				host: setting.redis.host,
				port: setting.redis.port,
				password: setting.redis.password
			}

			await Promise.all([
				this.createConnection(options, 'client'),
				this.createConnection(options, 'pubClient'),
				this.createConnection(options, 'subClient'),
				this.createConnection(options, 'queueClient')
			]).then(([client, pubClient, subClient, queueClient]) => {
				this.client = client;
				this.pubClient = pubClient;
				this.subClient = subClient;
				this.queueClient = queueClient;
			})
		},

		createConnection: async function(config, name){
			const client = redis.createClient({
				socket: {
					host: config.host,
					port: config.port,
					reconnectStrategy: (retries) => this.reconnectStrategy(retries)
				},
				password: config.password
			})

			this.bindEvents(client, name);
			await client.connect();

			return client;
		},

		// redis 재연결
		reconnectStrategy: function(retries) {
			if(retries == 0){
				console.error('[REDIS] initial reconnect attempt failed');
			}
			
			if(20 < retries){
				console.error('[REDIS] reconnect stopped after 20 attempts');
				return false;
			}
			
			return Math.min(200 * 2 ** retries, 5000);
		},

		// redis 클라이언트별 이벤트 바인딩
		bindEvents: function(client, name) {
			client.on('connect', () => {
			  	// console.log(`[REDIS:${name}] connected`);
			});
		  
			client.on('reconnecting', () => {
			  	// console.log(`[REDIS:${name}] reconnecting...`);
			});
		  
			client.on('error', (err) => {
				const message = err instanceof AggregateError
					? err.errors.map(e => e.message).join(' | ')
					: err.message;

			  	console.error(`[REDIS:${name}] error`, message);
			});
		  
			client.on('end', () => {
			  	console.warn(`[REDIS:${name}] connection closed`);
			});
		},

		// 키 값 조회
		get: async function(key){
			return await this.client.get(key)
		},

		// 키 값 설정
		set: async function(key, value, ttlSeconds){
			if(ttlSeconds!=undefined) return await this.client.set(key, value, { EX: ttlSeconds }) // s
			await this.client.set(key, value)
		},

		// 키 값 설정 (with lock)
		setWithLock: async function(key, value, ttlSeconds){
			if(ttlSeconds!=undefined) return await this.client.set(key, value, { EX: ttlSeconds, NX: true })
			return await this.client.set(key, value, { NX: true })
		},

		// 키 값 삭제
		del: async function(key){
			return await this.client.del(key)
		},

		// 키 값 존재 여부 조회
		exists: async function(key){
			return await this.client.exists(key)
		},

		// 키 값 만료 시간 설정
		expire: async function(key, ttlSeconds){
			return await this.client.expire(key, ttlSeconds)
		},

		// 키 값 만료 시간 조회
		ttl: async function(key){
			return await this.client.ttl(key)
		},

		// 키 값 증가
		incr: async function(key){
			return await this.client.incr(key)
		},

		// 키 값 증가 (by value)
		incrBy: async function(key, value){
			return await this.client.incrBy(key, value)
		},

		// 키 값 감소
		decr: async function(key){
			return await this.client.decr(key)
		},

		// 키 값 감소 (by value)
		decrBy: async function(key, value){
			return await this.client.decrBy(key, value)
		},

		// 채널 메시지 발행
		pub: async function(channel, value) {
			return await this.pubClient.publish(channel, value)
		},

		// 채널 메시지 구독
		sub: async function(channel, func) {
			return await this.subClient.subscribe(channel, func)
		},

		// 큐 메시지 추가
		queue: async function(queueName, value) {
			return await this.queueClient.lPush(`sys:queue:${queueName}`, JSON.stringify(value));
		},
	
		// 큐 메시지 소비 함수 등록
		consume: async function(queueName, handler) {
			const client = this.queueClient.duplicate(); // blocking 명령어는 queue별 connetion 필요
			this.bindEvents(client, `consumeClient:${queueName}`);
			await client.connect();
		  
			let running = true;
		  
			const loop = async () => {
				while(running){
					try{
						const result = await client.brPop(`sys:queue:${queueName}`, 5);
						if(result) await handler(JSON.parse(result.element));
					}catch(err){
						console.error('[QUEUE] error:', err);
						await new Promise(r => setTimeout(r, 1000));
					}					
				}

			  	await client.quit();
			};
		  
			loop();
		  
			return () => { running = false };
			/* 사용 례
				const stop = await redis.consume('queueName', handler); // stop 함수를 반환
				stop();
			*/
		}
	},

	worker: {
		tryWorkerProcessLock: async function(workerName, ttlSeconds){
			const result = await module.exports.redis.setWithLock(`sys:WPL:${workerName}`, 'LOCK', ttlSeconds)
			if(result){
				console.log(`[WORKER] ${workerName} 잠금 획득 성공, 실행 허용`);
				return true;
			}

			console.log(`[WORKER] ${workerName}이 이미 다른 프로세스에서 실행중입니다`);
			return false;
		},
	},

	socket: {
		io: null,
	},

	// operation별 rate limit 체크 (key를 ip로 사용한다면 #IP 사용)
	rateLimit: async function({ operation, key='#IP', windowMs, max }, req) {
		if(key=='#IP') {
			const rawIp = req.headers['cf-connecting-ip'] ||
				req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
				req.ip;
			if (!rawIp) key = 'unknown';
			else if (rawIp.startsWith('::ffff:')) key = rawIp.slice(7);
			else if (rawIp.includes(':')) key = rawIp.split(':').slice(0, 4).join(':') + '::/64';
			else key = rawIp;
		}

		const redisKey = `sys:rl:${operation}:${key}`;
		const ttlSec = Math.ceil(windowMs / 1000);

		const count = await module.exports.redis.incr(redisKey);
		if (count === 1) await module.exports.redis.expire(redisKey, ttlSec);

		return count <= max;
	}
}


/* Date 스트링 포멧형식으로 사용할 수 있게 추가 */
Date.prototype.stringFormat = function(format){
	/* 날짜 정보 초기화 */
	let y = this.getFullYear();
	let m = this.getMonth()+1;
	let d = this.getDate();
	let h = this.getHours();
	let i = this.getMinutes();
	let s = this.getSeconds();

	/* 날짜정보 이쁘게 만들기 */
	m = m<10?'0'+m:m;
	d = d<10?'0'+d:d;
	h = h<10?'0'+h:h;
	i = i<10?'0'+i:i;
	s = s<10?'0'+s:s;

	/* 포멧 변환 후 반환 */
	return format.replace(/y/g, y).replace(/m/g, m).replace(/d/g, d).replace(/h/g, h).replace(/i/g, i).replace(/s/g, s);
}

/* Number(초) 시간 단위로 변환하여 사용할 수 있게 추가 */
Number.prototype.secToTime = function(type){
	if(this < 60) return `1분 미만`;
	if(this < 60*60 || type=='min') return `${parseInt(this/60)}분`;
	if(this < 60*60*24 || type=='hour') return `약 ${parseInt(this/(60*60))}시간`;
	if(this < 60*60*24*30.5 || type=='day') return `약 ${parseInt(this/(60*60*24))}일`;
	if(this < 60*60*24*365 || type=='month') return `약 ${parseInt(this/(60*60*24*30))}달`;
	else return `약 ${parseInt(this/(60*60*24*365))}년`;
}

/* mysql 검색용으로 사용할 UTC 시간 포멧으로 변환 */
Date.prototype.toSQLDatetime = function() {
	if (isNaN(this)) throw new Error('Invalid date string');
  
	const year = this.getUTCFullYear();
	const month = this.getUTCMonth() + 1;
	const day = this.getUTCDate();
	const hour = this.getUTCHours();
	const minute = this.getUTCMinutes();
	const second = this.getUTCSeconds();
  
	const pad2 = n => (n < 10 ? '0' + n : n);
  
	return `${year}-${pad2(month)}-${pad2(day)} ${pad2(hour)}:${pad2(minute)}:${pad2(second)}`;
}

/* 숫자 타입에서 쓸 수 있도록 format() 함수 추가 */
Number.prototype.format = function(){
	if(this==0) return 0;
 
	var reg = /(^[+-]?\d+)(\d{3})/;
	var n = (this + '');
 
	while (reg.test(n)) n = n.replace(reg, '$1' + ',' + '$2');
 
	return n;
};
 
/* 문자열 타입에서 쓸 수 있도록 format() 함수 추가 */
String.prototype.format = function(){
	var num = parseFloat(this);
	if( isNaN(num) ) return "0";
 
	return num.format();
};

/* Number(초) 시간 단위로 변환하여 사용할 수 있게 추가 */
Number.prototype.secToTime = function(type){
	if(this < 60) return `1분 미만`;
	if(this < 60*60 || type=='min') return `${parseInt(this/60)}분`;
	if(this < 60*60*24 || type=='hour') return `약 ${parseInt(this/(60*60))}시간`;
	if(this < 60*60*24*30.5 || type=='day') return `약 ${parseInt(this/(60*60*24))}일`;
	if(this < 60*60*24*365 || type=='month') return `약 ${parseInt(this/(60*60*24*30))}달`;
	else return `약 ${parseInt(this/(60*60*24*365))}년`;
}

/* 숫자를 읽는 숫자로 변경 */
Number.prototype.toReadFormat = function(){
    if(this<1000) return this;
    var s = ['', 'K', 'M', 'B', 'T'];
    var e = Math.floor(Math.log(this) / Math.log(1000));
    return (this / Math.pow(1000, e)).toFixed(2) + s[e];
}

/* 숫자(바이트)를 읽는 용량으로 변경 */
Number.prototype.byteSizeToString = function(){
	var i = this == 0 ? 0 : Math.floor(Math.log(this) / Math.log(1000));
	return (this / Math.pow(1000, i)).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}

/* 숫자(초)를 시간 string으로 변경 */
Number.prototype.secToTimeFormat = function(){
	let h = parseInt(this/3600)
	let m = parseInt(this%3600 / 60)
	let s = parseInt(this%60)

	if(m<10) m = `0${m}`;
	if(s<10) s = `0${s}`;

	return `${h}:${m}:${s}`
}
