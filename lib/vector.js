
'use strict';
const http = require('http');
const assert = require("assert")
const compose = require('koa-compose');
const debug = require('debug')('route')
const pathToRegExp = require('path-to-regexp');

// Fetch HTTP Methods 
// 获取HTTP方法 ( `http.METHODS`  Added in: v0.11.8 )
const METHODS = http.METHODS.map((m) => { return m.toLowerCase() });

// Vector Router class
function Vector(app) {
    if (!(this instanceof Vector)) {
        return new Vector(app)
    };
    // router middleware
    // 路由中间件
    this.beforeFn = [];
    this.handlers = {};
    this.afterFn = [];
    this.nexts = [];

    // path params keys
    this.keys = [];

    // prefixs 前缀
    // 逐级替换掉参数(替换)
    // repleace  path progressively
    this.prefixs = [];
    // path prefix filter
    this.prefixRegex = undefined;
    // path （default is `/`）
    this.path = "/";
    this.pathRegex = /^\/$/i;

    // domain
    this.domain = "";
    this.domainstr = "";
    this.extDomain = false;
    this.domainRegex = undefined;

    // Auto binds koa instance
    if (app) {
        app.use(this.middleware());
    }
    return this;
}



/**
 * 连接下一个路径
 * Link next router
 * @param {String|RegExp|Vector} path router path 
 * @param {String|RegExp} domain
 */
Vector.prototype.next = function (path, domain) {
    let next = new Vector();
    let pathReg = path instanceof RegExp ? path : pathToRegExp(path === "/" ? path : path.replace(/\/$/, ""), next.keys);
    let pathStr = pathReg.source.toString();
    let prefReg = new RegExp(pathStr.replace("(?:\\/)?$", "").replace("+?)", "+)"), pathReg.flags);

    next.pathRegex = pathReg;
    next.prefixRegex = prefReg;
    next.path = this.path === "/" ? path : this.path + path;
    next.prefixs = this.prefixRegex ? this.prefixs.concat(this.prefixRegex) : this.prefixs;
    if (this.domain) {
        next.extDomain = true;
        next.domain = this.domain;
        next.domainstr = this.domainstr;
        next.domainRegex = this.domainRegex;
    } else if (domain) {
        // 域名格式解析 parse domainstr
        let domreg = (domain instanceof RegExp) ? domain : (
            (!~domain.indexOf("*")) ? domain.toLowerCase() : (
                new RegExp(domain.replace(/\./g, "\\.").replace(/\*/g, "[^\\.]+").replace(/$/, "$"), "i")
            )
        );
        next.domain = domain;
        next.domainstr = domain.toString();
        next.domainRegex = domreg;
    }

    next.afterFn = this.afterFn;
    next.beforeFn = this.beforeFn;
    this.nexts.push(next);
    return next;
};


// 绑定HTTP方法
// Binds Http function
if (!~METHODS.indexOf('all')) {
    METHODS.push('all');
}
METHODS.forEach((method) => {
    Vector.prototype[method] = function (...cbs) {
        // 检查中间件函数类型
        // check middleware function type
        let path = this.path;
        cbs.forEach((cb) => {
            isGenerator(cb, path);
        });
        // 加入栈 
        // push to stack 
        this.handlers[method.toUpperCase()] = cbs;
        return this;
    };
});


/**
 *  指定几个http请求方法
 *  option allow HTTP method
 *  @param {Array[String]} types allowed http type
 */
Vector.prototype.allow = function (methods, ...cbs) {
    let path = this.path;
    cbs.forEach((cb) => {
        isGenerator(cb, path);
    });
    methods.forEach((method) => {

        assert(!!~METHODS.indexOf(method.toLowerCase()))

        this.handlers[method.toUpperCase()] = cbs;
    })
    return this;
};

// 扩展方法
Vector.prototype.static = function (toPath) {
    this.handlers["redirect"] = [async (ctx, next) => {
        // ctx.redirect(toPath)
    }];
    return this;
};


// 扩展方法
Vector.prototype.redirect = function (toPath) {
    this.handlers["redirect"] = [async (ctx, next) => {
        ctx.redirect(toPath)
    }];
    return this;
};


/**
 * 绑定前置中间件
 * bind before middleware
 * @param  {...any} cbs 
 */
Vector.prototype.before = function (...cbs) {
    let path = this.path;
    cbs.forEach((cb) => {
        isGenerator(cb, path);
    });
    this.beforeFn = this.beforeFn.concat(cbs);
    return this;
};

/**
 * 绑定后置中间件
 * bind after middleware
 * @param  {...any} cbs 
 */
Vector.prototype.after = function (...cbs) {
    let path = this.path;
    cbs.forEach((cb) => {
        isGenerator(cb, path);
    });
    this.afterFn = this.afterFn.concat(cbs);
    return this;
};


/**
 * 清理前置中间件
 * clear common before middleware
 */
Vector.prototype.clearBefore = function () {
    this.beforeFn = [];
    return this;
};

/**
 * 清理后置中间件
 * clear common after middleware
 */
Vector.prototype.clearAfter = function () {
    this.afterFn = [];
    return this;
};

/**
 * 清理前置中间件
 * clear router prefix 
 */
Vector.prototype.clearPrefix = function () {
    this.prefixs = [];
    return this;
};
/**
 * 通用清理
 * clear 
 * @param {String} type 
 */
// Vector.prototype.clear =  (type)=> {
//     switch(type){
//         case "before": this.beforeFn=[];break;
//         case "after" : this.afterFn=[]; break;
//         case "prefix" : this.prefixs=[]; break;
//     }
//     return this;
// };






/**
 * 路由匹配方法
 * @param {*} request 请求体
 * @param {string } [path] 过滤后的路径
 */
Vector.prototype.match = function (request, path) {
    let cbs = [];
    let that = this;

    let _path = request.path;
    let _method = request.method;
    let _hostname = request.hostname;
    debug(request.path + "===>" + this.path)
    // 域名检测(域名不通过不用处理)
    if (!(that.domain === "" || that.domain === "*" || that.domain === _hostname || (that.domainRegex && that.domainRegex.test(_hostname)))) {
        return [];
    }

    // 非传递路径(去除上级前缀)
    if (!path && that.prefixs.length) {
        debug("非传递路径")
        for (let reg of this.prefixs) {
            _path.replace(reg, "");
        }
    };

    // 优先去传递来的路径
    _path = path || _path;

    // 路径判断,需要匹配前缀
    if (this.prefixRegex && !(this.prefixRegex.test(_path))) {
        return cbs;
    }

    // 处理本级参数，移除路径前缀
    let params = {};
    if (this.keys.length) {
        let values = _path.match(this.prefixRegex);
        values = values.slice(1);
        for (let i = 0; i < values.length; i++) {
            params[this.keys[i].name] = values[i];
        }
    }

    // 合并操作
    Object.assign(request.params, params);

    // 先检查子路由
    let nextPath = _path.replace(that.prefixRegex, "");
    if (nextPath && nextPath != "/") {
        for (let i = 0; i < that.nexts.length; i++) {
            let route = that.nexts[i]
            let cbs = route.match(request, nextPath)
            if (cbs && cbs.length) {
                return cbs;
            }
        }
    }

    // 路径判断,需完全匹配
    if (this.pathRegex && !(this.pathRegex.test(_path))) {
        return [];
    }

    // 后处理当前级别handles
    if (Object.keys(this.handlers).length) {
        // 先处理扩展方法,再处理标准方法，最后处理通用方法
        if (this.handlers["redirect"]) {
            cbs = this.handlers["redirect"];
        } else if (this.handlers["static"]) {
            cbs = this.handlers["static"];
        } else if (this.handlers[_method]) {
            cbs = this.handlers[_method];
        } else {
            cbs = this.handlers['ALL'];
        }
    }
    // 处理回调
    if (cbs) {
        // 前置 路由
        cbs = that.beforeFn.concat(cbs);
        // 后置路由    
        cbs = cbs.concat(that.beforeFn);
    }
    return cbs;
}

/**
 * 中间件
 */
Vector.prototype.middleware = function () {
    let that = this;
    return async (ctx, next) => {
        ctx.request.params = {};
        let cbs = that.match(ctx.request);
        if (cbs.length) {
            return await compose(cbs)(ctx, next);
        }
        return await next();
    }
}

module.exports = Vector;


// 判断函数类型
// isGenerator
/**
 * 
 * @param {*} fn 
 * @param {*} path 
 */
const isGenerator = function (fn, path) {
    assert(fn && fn.constructor && fn.constructor.name === 'AsyncFunction',
        'You must provide AsyncFunction for route ' + path);
}


/**

 * @param {string | RegExp } domain 
 * @returns {RegExp} 
 */
const compileDomainReg = function (domain) {
    return (domain instanceof RegExp) ? domain : (
        !~domain.indexOf("*") ? domain.toLowerCase() : (
            new RegExp(domain.replace(/\./g, "\\.").replace(/\*/g, "[^\\.]+").replace(/$/, "$"), "i")
        )
    );
}