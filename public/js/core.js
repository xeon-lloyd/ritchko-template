const API = {
	_rotateTokenPromise: null,
	
    request: async function(operation, param, _401Retry=true){
        return new Promise(function(resolve, reject){
			const xhr = new XMLHttpRequest();
			xhr.open('POST', `/API`);
			xhr.setRequestHeader('Content-Type', 'application/json');

            const requestAccessToken = cookie.get('accessToken');
            if(requestAccessToken){
                xhr.setRequestHeader('auth', requestAccessToken);
            }

			xhr.onreadystatechange = async function(){
				if(xhr.readyState != 4) return;

				if(xhr.status == 400) return resolve(JSON.parse(xhr.responseText));

				if(xhr.status == 404) return resolve(null);

				if(xhr.status == 200){
					let result = JSON.parse(xhr.responseText);

					if(_401Retry && result.response == 401){
						const currentAccessToken = cookie.get('accessToken');
						if(currentAccessToken && requestAccessToken != currentAccessToken){
							result = await API.request(operation, param, false);
						}else{
							const rotated = await API.rotateToken(requestAccessToken);
							if(rotated){
								result = await API.request(operation, param, false);
							}
						}
					}

					return resolve(result);
				}

				resolve(null);
			}

			xhr.onerror = function(){
				resolve(null);
			}

            xhr.send(JSON.stringify({ operation, param }));
		});
    },

    setToken: function(accessToken, refreshToken){
        cookie.set('accessToken', accessToken, env.token.accessTokenExpire)
		cookie.set('refreshToken', refreshToken, env.token.refreshTokenExpire)
    },

	rotateToken: async function(requestAccessToken){
		if(API._rotateTokenPromise != null) return API._rotateTokenPromise;

		API._rotateTokenPromise = API._rotateTokenHelper.run(requestAccessToken);

		return API._rotateTokenPromise;
	},

	_rotateTokenHelper: {
		lockKey: 'API:rotateTokenLock',
		lockTTL: 10 * 1000,
		lockWait: 10 * 1000,
		lockInterval: 50,

		run: async function(requestAccessToken){
			try{
				if(typeof navigator != 'undefined' && navigator.locks && navigator.locks.request){
					return await navigator.locks.request('API:rotateToken', async function(){
						return await API._rotateTokenHelper.runLocked(requestAccessToken);
					});
				}

				return await API._rotateTokenHelper.runWithStorageLock(requestAccessToken);
			}finally{
				API._rotateTokenPromise = null;
			}
		},

		runWithStorageLock: async function(requestAccessToken){
			const startAt = Date.now();

			while(Date.now() - startAt < API._rotateTokenHelper.lockWait){
				const currentAccessToken = cookie.get('accessToken');
				if(currentAccessToken && requestAccessToken != currentAccessToken){
					return true;
				}

				const lockOwner = await API._rotateTokenHelper.acquireLock();
				if(lockOwner){
					try{
						return await API._rotateTokenHelper.runLocked(requestAccessToken);
					}finally{
						API._rotateTokenHelper.releaseLock(lockOwner);
					}
				}

				await API._rotateTokenHelper.sleep(API._rotateTokenHelper.lockInterval);
			}

			const currentAccessToken = cookie.get('accessToken');
			if(currentAccessToken && requestAccessToken != currentAccessToken){
				return true;
			}

			await API.removeToken(cookie.get('refreshToken'));
			return false;
		},

		runLocked: async function(requestAccessToken){
			const currentAccessToken = cookie.get('accessToken');
			if(currentAccessToken && requestAccessToken != currentAccessToken){
				return true;
			}

			const refreshToken = cookie.get('refreshToken');
			if(!refreshToken){
				await API.removeToken();
				return false;
			}

			try{
				let result = await API.request(env.token.rotateTokenOperation, {
					refreshToken
				}, false);
				
				if(result && result.response == 200){
					API.setToken(result.data.accessToken, result.data.refreshToken);
					return true;
				}

				await API.removeToken(refreshToken);
				return false;
			}catch(e){
				await API.removeToken(refreshToken);
				return false;
			}
		},

		acquireLock: async function(){
			const now = Date.now();
			const currentLock = API._rotateTokenHelper.getLock();
			if(currentLock && currentLock.expiresAt > now) return null;

			const owner = `${now}:${Math.random().toString(36).slice(2)}`;
			try{
				localStorage.setItem(API._rotateTokenHelper.lockKey, JSON.stringify({
					owner,
					expiresAt: now + API._rotateTokenHelper.lockTTL
				}));
			}catch(e){
				return owner;
			}

			await API._rotateTokenHelper.sleep(25);

			const savedLock = API._rotateTokenHelper.getLock();
			if(savedLock && savedLock.owner == owner) return owner;
			return null;
		},

		getLock: function(){
			try{
				const lock = JSON.parse(localStorage.getItem(API._rotateTokenHelper.lockKey));
				if(!lock || !lock.owner || !lock.expiresAt) return null;

				if(lock.expiresAt <= Date.now()){
					localStorage.removeItem(API._rotateTokenHelper.lockKey);
					return null;
				}

				return lock;
			}catch(e){
				return null;
			}
		},

		releaseLock: function(owner){
			const currentLock = API._rotateTokenHelper.getLock();
			if(currentLock && currentLock.owner == owner){
				try{
					localStorage.removeItem(API._rotateTokenHelper.lockKey);
				}catch(e){}
			}
		},

		sleep: function(ms){
			return new Promise(function(resolve){
				setTimeout(resolve, ms);
			});
		},
	},

    removeToken: async function(refreshToken){
		const targetRefreshToken = refreshToken || cookie.get('refreshToken');
        
		try{
			// 서버 로그아웃 시도
			if(targetRefreshToken){
				await API.request(env.token.signOutOperation, {
					refreshToken: targetRefreshToken
				}, false);
			}
		}finally{
			if(!refreshToken || cookie.get('refreshToken') == refreshToken){
				cookie.set('accessToken', null, -1)
				cookie.set('refreshToken', null, -1)
			}
		}
    },
}


/* cookie 관련 */
const cookie = {
	/* 쿠키 가져오기 */
	get: function(name){
		var nameEQ = name + "=";
		var ca = document.cookie.split(';');
		for(var i=0;i < ca.length;i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1,c.length);
			if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
		}
		return null;
	},

	/* 쿠키 설정하기 */
	set: function(name, value, seconds){
		var expires = "";
		if(seconds){
			var date = new Date();
			date.setTime(date.getTime() + (seconds*1000));
			expires = "; expires=" + date.toUTCString();
		}
		document.cookie = name + "=" + (value || "")  + expires + "; path=/";
	}
}


/* alert 관련 */
function alert(content, success){
	let ele = document.createElement('div');
	ele.className = success?'success':'error';
	ele.innerHTML = content || '';

	setTimeout(function(){
		ele.style.opacity = '0';

		setTimeout(function(){
			ele.remove();
		}, 200)
	}, 7000);

	document.querySelector('#alertArea').appendChild(ele);
	setTimeout(function(){
		ele.style.margin = '10px';
	}, 10);
}


/* dimmedCover 관련 */
const dimmedCover = {
	display: function(){
		document.querySelector('#dimmedCover').classList.add('display');
	},

	hide: function(){
		document.querySelector('#dimmedCover').classList.remove('display');
	}
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

/* html 이스케이핑 */
String.prototype.escapeHtml = function(){
	var map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	};
	return this.replace(/[&<>"']/g, function(m) { return map[m]; });
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
	if(this < 60) return `less than 1 minute`;
	if(this < 60*60 || type=='min') return `${parseInt(this/60)} minutes`;
	if(this < 60*60*24 || type=='hour') return `about ${parseInt(this/(60*60))} hours`;
	if(this < 60*60*24*30.5 || type=='day') return `about ${parseInt(this/(60*60*24))} days`;
	if(this < 60*60*24*365 || type=='month') return `about ${parseInt(this/(60*60*24*30))} months`;
	else return `about ${parseInt(this/(60*60*24*365))} years`;
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
