/* textarea 전역 실행 */
const tx = document.querySelectorAll("textarea");
for (let i = 0; i < tx.length; i++) {
    tx[i].setAttribute("style", "height:" + (tx[i].scrollHeight + 10) + "px;overflow-y:hidden;");
}


/* operation 섹션 fold 적용 */
const opSec = document.querySelectorAll(".operation > .title");
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


/* API 요청 버튼 적용 */
const RequestButton = document.querySelectorAll(".operation > .param > .requset");
for (let i = 0; i < RequestButton.length; i++) {
    RequestButton[i].addEventListener('click', (e)=>{
        let operation = e.currentTarget.parentNode.parentNode.dataset.operation;
        let param;
        try{
            param = JSON.parse(e.currentTarget.parentNode.querySelector('textarea').value);
        }catch(ex){
            e.currentTarget.parentNode.parentNode.querySelector('.param > .requestAt').innerHTML = new Date();
            e.currentTarget.parentNode.parentNode.querySelector('.param > .API_Response').innerHTML = '[ 잘못된 param JSON 형식 ]'
            return;
        }

        API_Request(operation, param, e.currentTarget.parentNode.parentNode);
    })
}

/* API 요청 매서드 */
function API_Request(operation, param, from){
    const xhr = new XMLHttpRequest();
    const method = "POST";
    const url = "/API";

    const data = [{
        operation,
        param
    }];

    xhr.open(method, url);

    xhr.setRequestHeader('Content-Type', 'application/json');

    const authKey = document.querySelector('.container > .setAuth > .input > input').value;
    if(authKey){
        xhr.setRequestHeader('auth', authKey);
    }

    xhr.addEventListener('readystatechange', function (event) {
        const { target } = event;

        if (target.readyState === XMLHttpRequest.DONE) {
            const { status } = target;

            if (status === 0 || (status >= 200 && status < 400)) {
                // 요청이 정상적으로 처리 된 경우
                let result = JSON.parse(target.response)[0]
                from.querySelector('.param > .requestAt').innerHTML = new Date();
                from.querySelector('.param > .API_Response').innerHTML = JSON.stringify(result, null, 4);
            } else {
                // 에러가 발생한 경우
            }
        }
    });

    xhr.send(JSON.stringify(data));
}