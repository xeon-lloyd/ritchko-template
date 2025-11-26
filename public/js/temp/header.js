/* 메뉴바에 로그인 버튼 관련 */
const upBarLogin = {
    init: async function(){
        const userInfo = await API.requestSingle('GetUserInfo');

		if(userInfo.response==200){
			document.querySelector('#menu #nickname').innerHTML = userInfo.data.name;
			document.querySelector('#header #login').classList.remove('display');
			document.querySelector('#header #createAccount').classList.remove('display');
			document.querySelector('#header #menu-toggle').classList.add('display');
		}else{
			document.querySelector('#header #login').classList.add('display');
			document.querySelector('#header #createAccount').classList.add('display');
			document.querySelector('#header #menu-toggle').classList.remove('display');
		}

		document.querySelector('#header #menu-toggle').addEventListener('click', ()=>{
			document.querySelector('#menu').classList.add('display');
		})

		window.addEventListener('click', (e)=>{
			if(
				e.target.id=="menu-toggle" ||
				e.target.parentNode.id=="menu-toggle"
			) return;

			document.querySelector('#menu').classList.remove('display');
		})
    },

	logout: function(){
		API.removeAuthKey();
		location.reload();
	}
}
window.addEventListener('load', upBarLogin.init)