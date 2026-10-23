/* 메뉴바 로그인 상태 */
const upBarLogin = {
    htmlEle: {
        login: document.querySelector('#header #login'),
        createAccount: document.querySelector('#header #createAccount'),
        profileMenuToggle: document.querySelector('#header #profileMenuToggle'),
        menu: document.querySelector('#menu'),
        nickname: document.querySelector('#menu #nickname'),
        logoutButton: document.querySelector('#logoutButton'),
    },

    init: async function(){
        this.htmlEle.profileMenuToggle.addEventListener('click', () => {
            this.setMenuOpen(!this.htmlEle.menu.classList.contains('display'));
        });
        this.htmlEle.logoutButton.addEventListener('click', () => this.logout());
        window.addEventListener('click', (event) => {
            if(this.htmlEle.profileMenuToggle.contains(event.target)) return;
            if(this.htmlEle.menu.contains(event.target)) return;
            this.setMenuOpen(false);
        });
        window.addEventListener('keydown', (event) => {
            if(event.key != 'Escape' || !this.htmlEle.menu.classList.contains('display')) return;
            this.setMenuOpen(false);
            this.htmlEle.profileMenuToggle.focus();
        });
        this.setLoggedInState(null);
        const userInfo = await API.request('GetUserInfo');
        this.setLoggedInState(userInfo?.response == 200 ? userInfo.data : null);
    },

    setLoggedInState: function(user){
        this.htmlEle.login.classList.toggle('display', !user);
        this.htmlEle.createAccount.classList.toggle('display', !user);
        this.htmlEle.profileMenuToggle.classList.toggle('display', !!user);
        this.htmlEle.nickname.textContent = user ? user.name : '';
        this.setMenuOpen(false);
    },

    setMenuOpen: function(isOpen){
        this.htmlEle.menu.classList.toggle('display', isOpen);
        this.htmlEle.profileMenuToggle.classList.toggle('active', isOpen);
        this.htmlEle.profileMenuToggle.setAttribute('aria-expanded', String(isOpen));
    },

    logout: async function(){
        await API.removeToken();
        location.reload();
    }
}
window.addEventListener('load', () => upBarLogin.init());
