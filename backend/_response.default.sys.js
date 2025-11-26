module.exports = {
    OK: class {
        constructor(data, message) {
            this.data = data || null;
            this.message = message || "success";
        }

        response = 200;
        message = "";
        label = null;
        target = null;
        data = null;
    },

    BadRequest: class {
        constructor(label, message) {
            this.label = label || null;
            this.message = message || "Bad Request";
        }

        response = 400;
        message = "";
        label = null;
        target = null;
        data = null;
    },

    Unauthorized: class {
        constructor(label, message) {
            this.label = label || null;
            this.message = message || "로그인이 필요합니다";
        }

        response = 401;
        message = "";
        label = null;
        target = null;
        data = null;
    },
    
    Forbidden: class {
        constructor(label, message) {
            this.label = label || null;
            this.message = message || "Forbidden";
        }

        response = 403;
        message = "";
        label = null;
        target = null;
        data = null;
    },

    NotFound: class {
        constructor(label, message) {
            this.label = label || null;
            this.message = message || "Not found";
        }

        response = 404;
        message = "";
        label = null;
        target = null;
        data = null;
    },

    MethodNotAllowed: class {
        constructor(label, message) {
            this.label = label || null;
            this.message = message || "Method Not Allowed";
        }

        response = 405;
        message = "";
        label = null;
        target = null;
        data = null;
    },

    InternalServerError: class{
        constructor(label, message) {
            this.label = label || null;
            this.message = message || "Internal Server Error";
        }

        response = 500;
        message = "";
        label = null;
        target = null;
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