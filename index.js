'use strict';
/**
 * koa-vector
 * @module router
 * @author Hanrea
 * @license MIT
 */
const cache = require("./lib/cache");
const proxy = require("./lib/proxy");
const static = require("./lib/static");


function Router(app) {
    if (this instanceof Router) {
    }
    assert(app, 'You must provide app instance to use routing');
    // return middleware for dispatching requests
    // app.use();
    return;
}
module.exports = Router;


app.use(router(app,{}));


