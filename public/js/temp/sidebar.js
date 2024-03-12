/* 사이드바 관련 */
const sidebar = {
	init: function(){
		try{
			document.querySelector('#sidebar > #control > i').addEventListener('click', sidebar.toggleFold)
            document.body.classList.remove('before-sidebar-calc')

			if(window.innerWidth <= 650){
				this.toggleFold();
			}
		}catch(e){
            
		}
	},

	toggleFold: function(){
		let classN = document.body.className;

		if(classN.indexOf('sidebar')>-1){
			document.body.classList.add('foldedSidebar')
			document.body.classList.remove('sidebar')
			document.querySelector('#sidebar > #control > i').className = "fa-solid fa-angles-right"
		}else if(classN.indexOf('foldedSidebar')>-1){
			document.body.classList.add('sidebar')
			document.body.classList.remove('foldedSidebar')
			document.querySelector('#sidebar > #control > i').className = "fa-solid fa-angles-left"
		}
	}
}
window.addEventListener('load', ()=>{
	sidebar.init();
})