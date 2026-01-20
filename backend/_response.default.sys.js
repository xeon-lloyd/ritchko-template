module.exports = {
    OK: class {
        constructor(data, message) {
            this.data = data || null;
            this.message = message || "success";
        }

        response = 200;
        message = "";
        target = null;
        data = null;
    },

    BadRequest: class {
        constructor(message) {
            this.message = message || "Bad Request";
        }

        response = 400;
        message = "";
        target = null;
        data = null;
    },

    Unauthorized: class {
        constructor(message) {
            this.message = message || "로그인이 필요합니다";
        }

        response = 401;
        message = "";
        target = null;
        data = null;
    },
    
    Forbidden: class {
        constructor(message) {
            this.message = message || "Forbidden";
        }

        response = 403;
        message = "";
        target = null;
        data = null;
    },

    NotFound: class {
        constructor(message) {
            this.message = message || "Not found";
        }

        response = 404;
        message = "";
        target = null;
        data = null;
    },

    MethodNotAllowed: class {
        constructor(message) {
            this.message = message || "Method Not Allowed";
        }

        response = 405;
        message = "";
        target = null;
        data = null;
    },

    TooManyRequests: class TooManyRequests {
        response = 429;
        message = "Too many requests";
        target = null;
        data = null;
    },

    InternalServerError: class{
        constructor(message) {
            this.message = message || "Internal Server Error";
        }

        response = 500;
        message = "";
        target = null;
        data = null;
    },

    InputValueNotValid: class InputValueNotValid {
        constructor(target){
            if(target) this.target = target;
        }

        response = 400;
        message = "Input value is not valid"
        target = '{param}'
        data = null;
    },


    /* // webhooks // */
    RedirectTo: class{
        constructor(redirectPath) {
            this.path = redirectPath || "";
        }

        Behavior = "Redirect"
        path = ""
    }
}