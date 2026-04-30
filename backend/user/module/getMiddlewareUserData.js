const util = require('../../core/util.js');
const setting = require('../../core/setting.js');

// 미들웨어에서 사용자 데이터 조회 로직
module.exports = async function getMiddlewareUserData(tokenData){
    // 캐싱된 사용자 데이터 조회
    // 미들웨어에서의 사용자 캐싱은 token session storage 이용 (토큰 로직으로 취급)
    const cacheKey = `cache:user:${tokenData.uid}`;
    let userData = await util.redis.get(cacheKey);
    if(userData) return JSON.parse(userData);
    
    // 캐싱된 사용자 데이터가 없다면 데이터베이스에서 조회
    const [ user ] = await util.mysql.select(
        'database1',
        'uid, id, name',
        'user',
        'uid=?',
        [ tokenData.uid ]
    )

    // 사용자 데이터 compose
    userData = {
        uid: user.uid,
        id: user.id,
        name: user.name,
    }

    // 사용자 데이터 캐싱 (10분)
    const USER_CACHE_EXPIRE = 10 * 60;
    await util.redis.set(cacheKey, JSON.stringify(userData), USER_CACHE_EXPIRE);

    return userData;
}