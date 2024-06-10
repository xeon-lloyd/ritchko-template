/* textarea 전역 실행 */
const tx = document.querySelectorAll("textarea");
for (let i = 0; i < tx.length; i++) {
    tx[i].setAttribute("style", "height:" + (tx[i].scrollHeight + 10) + "px;overflow-y:hidden;");
}

/* webhook filter 해제 */
const clearFilter = function(){
    let hidewebhooks = document.querySelectorAll('.webhook.hide')
    hidewebhooks.forEach(ele=>{ ele.classList.remove('hide') })
}

/* webhook group filter 적용 */
document.querySelector('.webhooks > .filter > .group').addEventListener('input', function(){
    clearFilter()

    try{
        document.querySelector('.webhooks > .filter > .keyword:not(:focus)').value = '';
    }catch(e){

    }    

    if(this.value=='') return

    let hideTarget = document.querySelectorAll(`.webhook:not([data-group="${this.value}"])`)
    hideTarget.forEach(ele=>{ ele.classList.add('hide') })

    document.querySelector('.webhooks').scrollIntoView();
})

/* webhook keyword filter 적용 */
document.querySelector('.webhooks > .filter > .keyword').addEventListener('input', function(){
    document.querySelector('.webhooks > .filter > .group').dispatchEvent(new Event('input'))

    if(this.value=='') return

    let webhooks = document.querySelectorAll('.webhook:not(.hide)')
    webhooks.forEach(ele=>{
        if(
            ele.dataset.webhook.toLowerCase().indexOf(this.value.toLowerCase())>-1 ||
            ele.querySelector('.title > .description').innerHTML.slice(2).indexOf(this.value)>-1
        ) return;

        ele.classList.add('hide')
    })

    document.querySelector('.webhooks').scrollIntoView();
})

/* webhook 섹션 fold 적용 */
const opSec = document.querySelectorAll(".webhook > .title");
for (let i = 0; i < opSec.length; i++) {
    opSec[i].addEventListener('click', (e)=>{
        if(e.currentTarget.parentNode.className.indexOf('folded')>-1){
            e.currentTarget.parentNode.classList.remove('folded')
            e.currentTarget.querySelector('.fold-toggle').classList.remove('fa-chevron-down')
            e.currentTarget.querySelector('.fold-toggle').classList.add('fa-chevron-up')
        }else{
            e.currentTarget.parentNode.classList.add('folded')
            e.currentTarget.querySelector('.fold-toggle').classList.add('fa-chevron-down')
            e.currentTarget.querySelector('.fold-toggle').classList.remove('fa-chevron-up')
        }
    })
}

/* webhookPath 복사 버튼 적용 */
const opCopy = document.querySelectorAll(".webhook > .title > i.copy-icon");
for(let i = 0; i < opCopy.length; i++) {
    opCopy[i].addEventListener('click', function(){
        this.parentNode.dispatchEvent(new Event('click'))

        let webhookPath = this.parentNode.parentNode.dataset.webhook;
        window.navigator.clipboard.writeText(webhookPath)

        alert(`webhookPath "${webhookPath}" copied`, true)
    })
}


/* API 요청 버튼 적용 */
const RequestButton = document.querySelectorAll(".webhook > .param > .requset");
for (let i = 0; i < RequestButton.length; i++) {
    RequestButton[i].addEventListener('click', (e)=>{
        let webhook = e.currentTarget.parentNode.parentNode.dataset.webhook;
        let method = e.currentTarget.parentNode.parentNode.dataset.method;
        let param;
        try{
            param = JSON.parse(e.currentTarget.parentNode.querySelector('textarea').value);
        }catch(ex){
            e.currentTarget.parentNode.parentNode.querySelector('.param > .requestAt').innerHTML = new Date();
            e.currentTarget.parentNode.parentNode.querySelector('.param > .API_Response').innerHTML = '[ 잘못된 param JSON 형식 ]'
            return;
        }

        API_Request(webhook, method, param, e.currentTarget.parentNode.parentNode);
    })
}

/* API 요청 매서드 */
function API_Request(webhookPath, method, param, from){
    let data = '';
    if(method=='get'){
        let keys = Object.keys(param)
        data += '?'
        keys.forEach((ele)=>{
            data += `&${ele}=${encodeURIComponent(param[ele])}`
        })
    }

    const xhr = new XMLHttpRequest();
    const url = `/webhook${webhookPath}${data}`;

    xhr.open(method, url);

    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.addEventListener('readystatechange', function (event) {
        const { target } = event;

        if (target.readyState === XMLHttpRequest.DONE) {
            const { status } = target;

            if (status === 0 || (status >= 200 && status < 400)) {
                // 요청이 정상적으로 처리 된 경우
                let result
                try{
                    result = JSON.parse(target.response)
                }catch(e){
                    result = `:RedirectTo ${target.responseURL}`
                }
                
                from.querySelector('.param > .API_Response').innerHTML = JSON.stringify(result, null, 4);
            } else {
                from.querySelector('.param > .API_Response').innerHTML = `":Error ${status}"`
            }

            from.querySelector('.param > .requestAt').innerHTML = new Date();
        }
    });

    if(method=='get') xhr.send();
    else xhr.send(JSON.stringify(param));
}



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