const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const setting = require(`./setting.js`);

module.exports = {
	appRoot: path.dirname(require.main.filename || process.mainModule.filename),

	/* 경로 유효범위 체크(상위 폴더 이동 방지) */
	securePath: function(src=''){
		let stack = [];

		src = src.split('/');

		for(let i=0;i<src.length;i++){
			if(src[i]=='') continue;

			if(src[i]=='..'){
				stack.pop();
			}else{
				stack.push(src[i]);
			}
		}

		return stack.join('/');
	},

	/* DB(mysql) 관련 */
	mysql: {
		/* DB 연결 */
		connection: {},
		connect: async function(db){
			setting.mysql[db].enableKeepAlive = true;

			const mysql = require('mysql2/promise');
			this.connection[db] = mysql.createPool(setting.mysql[db]);;
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
			let cipher = crypto.createCipheriv('aes-128-cbc', setting.encrypt.key, iv);
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
			let decipher = crypto.createDecipheriv('aes-128-cbc', setting.encrypt.key, iv);
			let decrypted = decipher.update(encrypted);
			let plainText = Buffer.concat([decrypted, decipher.final()]).toString();

			return plainText;
		}
	},

	/* 사용자 토큰 */
	token: {
		generateToken: function(userData){
			userData._tokenCreateAt = new Date().getTime()
			
			let payload = Buffer.from(JSON.stringify(userData)).toString('base64')
			let hash = module.exports.encrypt.oneWayLite(payload)
			return `${payload}.${hash}`;
		}
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

			this.auth = new awsS3.S3({
				endpoint: setting.s3.endpoint,
				region: setting.s3.region,
				credentials: {
					accessKeyId: setting.s3.accessKeyId,
					secretAccessKey: setting.s3.secretAccessKey,
				}
			});
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
		decodeFileToken: function(token){
			return JSON.parse(module.exports.encrypt.decode(token))
		},

		moveTo: async function(token, bucket, key){
			try{
				let fileName = this.decodeFileToken(token).name

				await module.exports.s3.copy({
					Bucket: bucket,
					CopySource: encodeURI(`/${setting.fileUpload.tempBucket}/${fileName}`),
					Key: key,
				})
	
				await module.exports.s3.delete({   
					Bucket: setting.fileUpload.tempBucket,      
					Key: fileName,
				})
			}catch(e){
				throw new Error("유효하지 않은 File Token")
			}
		},

		toStream: async function(token){
			try{
				let fileName = this.decodeFileToken(token).name

				let data = await module.exports.s3.auth.getObject({   
					Bucket: setting.fileUpload.tempBucket,      
					Key: fileName,
				});

				await module.exports.s3.delete({   
					Bucket: setting.fileUpload.tempBucket,      
					Key: fileName,
				})

				return data.Body
			}catch(e){
				throw new Error("유효하지 않은 File Token")
			}
		},
	},

	redis: {
		client: null,
		connect: async function(){
			const redis = require('redis')

			this.client = redis.createClient({
				socket: {
					host: setting.redis.host,
				  	port: setting.redis.port,
				},
				password: setting.redis.password
			});

			await this.client.connect();
		},

		get: async function(key){
			return await this.client.get(key)
		},

		set: async function(key, value, expire){
			if(expire!=undefined) return await this.client.set(key, value, { EX: expire }) // s
			await this.client.set(key, value)
		},

		del: async function(key){
			return await this.client.del(key)
		},

		incr: async function(key){
			return await this.client.incr(key)
		},

		pub: async function(channel, value) {
			return await this.pubClient.publish(channel, value)
		},

		sub: async function(channel, func) {
			return await this.subClient.subscribe(channel, func)
		},

		queue: async function(queueName, value) {
			return await this.client.lPush(`sys:queue:${queueName}`, JSON.stringify(value));
		},
	
		consume: async function (queueName, func) {
			const checkQueue = async () => {
				try {
					const message = await this.client.lPop(`sys:queue:${queueName}`);
		
					if (message) {
						await func(JSON.parse(message));
						checkQueue()
					} else {
						setTimeout(checkQueue, 1000);
					}
				} catch (err) {
					console.error('Queue consume error:', err);
					setTimeout(checkQueue, 1000); // 에러가 나면 1초 후 다시 시도
				}
			};
		
			checkQueue();
		},
	},

	socket: {
		io: null,
	},
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
