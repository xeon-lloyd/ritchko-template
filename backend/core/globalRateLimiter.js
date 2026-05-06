const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('redis');

const setting = require('./setting.js');
const response = require('../_response.default.sys.js');


// util.redis.client와 독립된 전용 연결 — require 시점에 RedisStore가 즉시 sendCommand를 호출하기 때문
const redisClient = redis.createClient({
	socket: {
		host: setting.redis.host,
		port: setting.redis.port,
		reconnectStrategy: (retries) => {
			if (retries > 20) {
				console.error('[RATE-LIMIT] Redis 재연결 중단 (20회 초과)');
				return false;
			}
			return Math.min(200 * 2 ** retries, 5000);
		},
	},
	password: setting.redis.password || undefined,
});
redisClient.on('error', e => console.error('[RATE-LIMIT] Redis 오류', e.message));
redisClient.connect().catch(e => console.error('[RATE-LIMIT] Redis 최초 연결 실패', e));

// Cloudflare → 프록시 → Express 순으로 IP 추출, IPv6는 /64 서브넷으로 정규화
function getClientIp(req) {
	const ip = req.headers['cf-connecting-ip'] ||
		req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
		req.ip;
	if (!ip) return 'unknown';
	if (ip.startsWith('::ffff:')) return ip.slice(7); // IPv4-mapped IPv6 → IPv4
	if (ip.includes(':')) return ip.split(':').slice(0, 4).join(':') + '::/64'; // IPv6 → /64 서브넷
	return ip;
}

module.exports = rateLimit({
	store: new RedisStore({
		sendCommand: (...args) => redisClient.sendCommand(args),
		prefix: 'sys:rl:',
	}),
	keyGenerator: getClientIp,
	windowMs: setting.rateLimit.windowMs, // 윈도우 크기
	limit: setting.rateLimit.limit,       // 윈도우 내 최대 요청 수
	standardHeaders: false,
	legacyHeaders: false,
	validate: false,
	handler: (req, res) => {
		res.send(new response.TooManyRequests());
	},
});
