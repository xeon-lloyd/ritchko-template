module.exports = {
    'OK': class {
        constructor(data, message) {
            this.data = data || null;
            this.message = message || "success";
        }

        response = 200;
        message = "";
        errorCode = null;
        data = null;
    },

    'BadRequest': class {
        constructor(errorCode, message) {
            this.errorCode = errorCode || null;
            this.message = message || "Bad Request";
        }

        response = 400;
        message = "";
        errorCode = null;
        data = null;
    },

    'Unauthorized': class {
        constructor(errorCode, message) {
            this.errorCode = errorCode || null;
            this.message = message || "로그인이 필요합니다";
        }

        response = 401;
        message = "";
        errorCode = null;
        data = null;
    },
    
    'Forbidden': class {
        constructor(errorCode, message) {
            this.errorCode = errorCode || null;
            this.message = message || "Forbidden";
        }

        response = 403;
        message = "";
        errorCode = null;
        data = null;
    },

    'NotFound': class {
        constructor(errorCode, message) {
            this.errorCode = errorCode || null;
            this.message = message || "Not found";
        }

        response = 404;
        message = "";
        errorCode = null;
        data = null;
    },

    'MethodNotAllowed': class {
        constructor(errorCode, message) {
            this.errorCode = errorCode || null;
            this.message = message || "Method Not Allowed";
        }

        response = 405;
        message = "";
        errorCode = null;
        data = null;
    },

    'InternalServerError': class{
        constructor(errorCode, message) {
            this.errorCode = errorCode || null;
            this.message = message || "Internal Server Error";
        }

        response = 500;
        message = "";
        errorCode = null;
        data = null;
    }
}