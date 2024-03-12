const API = {
    OperationComposer: class OperationComposer{
        operations = [];

        add = function(operationName, param){
            this.operations.push({
                operation: operationName,
                param
            })
        }

        request = ()=>{ return API.request(this.operations) }
    },

    request: async function(operations){
        if(operations==undefined || operations.constructor.name!='Array'){
            throw "operations muse be array"
        }

        return new Promise(function(resolve, reject){
			const xhr = new XMLHttpRequest();
			xhr.open('POST', `/API`);
			xhr.setRequestHeader('Content-Type', 'application/json');

            const authKey = cookie.get('authKey');
            if(authKey){
                xhr.setRequestHeader('auth', authKey);
            }

			xhr.onreadystatechange = async function(){
				if(xhr.status == 400){
					resolve(JSON.parse(xhr.responseText));
				}

				if(xhr.status == 404){
					resolve(null);
				}

				if(xhr.readyState == 4 && xhr.status == 200){
					resolve(JSON.parse(xhr.responseText));
				}
			}

            xhr.send(JSON.stringify(operations));
		});
    },

    requestSingle: async function(operationName, param){
        const res = await API.request([{
            operation: operationName,
            param
        }])

        return res[0]
    },

    setAuthKey: function(key, expires){ //expires day
        cookie.set('authKey', key, expires)
    },

    removeAuthKey: function(){
        cookie.set('authKey', null, -1)
    },

    formToOperation: function(formName){

    }
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
	set: function(name, value, days){
		var expires = "";
		if(days){
			var date = new Date();
			date.setTime(date.getTime() + (days*24*60*60*1000));
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


/* cover 관련 */
const cover = {
	display: function(){
		document.querySelector('#cover').classList.add('display');
	},
	
	hide: function(){
		document.querySelector('#cover').classList.remove('display');
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