/* textarea 전역 실행 */
const tx = document.querySelectorAll("textarea");
for (let i = 0; i < tx.length; i++) {
    tx[i].setAttribute("style", "height:" + (tx[i].scrollHeight + 10) + "px;overflow-y:hidden;");
}

/* operation filter 해제 */
const clearFilter = function(){
    let hideOperations = document.querySelectorAll('.operation.hide')
    hideOperations.forEach(ele=>{ ele.classList.remove('hide') })
}

/* operation group filter 적용 */
document.querySelector('.operations > .filter > .group').addEventListener('input', function(){
    clearFilter()

    try{
        document.querySelector('.operations > .filter > .keyword:not(:focus)').value = '';
    }catch(e){

    }    

    if(this.value=='') return

    let hideTarget = document.querySelectorAll(`.operation:not([data-group="${this.value}"])`)
    hideTarget.forEach(ele=>{ ele.classList.add('hide') })

    document.querySelector('.operations').scrollIntoView();
})

/* operation type filter 적용 */
document.querySelector('.operations > .filter > .type').addEventListener('input', function(){
    clearFilter()

    try{
        document.querySelector('.operations > .filter > .keyword:not(:focus)').value = '';
    }catch(e){

    }    

    document.querySelector('.operations > .filter > .group').dispatchEvent(new Event('input'))

    if(this.value=='') return

    let hideTarget = document.querySelectorAll(`.operation:not([data-type="${this.value}"])`)
    hideTarget.forEach(ele=>{ ele.classList.add('hide') })

    document.querySelector('.operations').scrollIntoView();
})

/* operation keyword filter 적용 */
document.querySelector('.operations > .filter > .keyword').addEventListener('input', function(){
    document.querySelector('.operations > .filter > .type').dispatchEvent(new Event('input'))

    if(this.value=='') return

    let operations = document.querySelectorAll('.operation:not(.hide)')
    operations.forEach(ele=>{
        if(
            ele.dataset.operation.toLowerCase().indexOf(this.value.toLowerCase())>-1 ||
            ele.querySelector('.title > .description').innerHTML.slice(2).indexOf(this.value)>-1
        ) return;

        ele.classList.add('hide')
    })

    document.querySelector('.operations').scrollIntoView();
})

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

/* operationName 복사 버튼 적용 */
const opCopy = document.querySelectorAll(".operation > .title > i.copy-icon");
for(let i = 0; i < opCopy.length; i++) {
    opCopy[i].addEventListener('click', function(){
        this.parentNode.dispatchEvent(new Event('click'))

        let operationName = this.parentNode.parentNode.dataset.operation;
        window.navigator.clipboard.writeText(operationName)

        alert(`operationName "${operationName}" copied`, true)
    })
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