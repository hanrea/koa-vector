

const pathToRegExp = require('path-to-regexp');

function test(path, link){
    let keys = [];


    let pathReg = path instanceof RegExp ? path : pathToRegExp( path === "/" ? path : path.replace(/\/$/,"") , keys);
    let pathStr = pathReg.source.toString();
    let prefReg = new RegExp( pathStr.replace("(?:\\/)?$","").replace("+?)","+)"), pathReg.flags);
    
    console.log("====================");
    console.log("====================");
    console.log("====================");
    console.log("test router》》》   "+path +"  >>>>    "+link);
    console.log(pathReg)
    console.log(prefReg)
    console.log("-----------------");
    console.log(pathReg.test(link));
    console.log(link.match(pathReg));
    console.log("-----------------");
    console.log(prefReg.test(link));
    console.log(link.match(prefReg));
    console.log(link.replace(prefReg,""))
    console.log("====================");
    console.log("====================");
    console.log("====================");
    return ;
}


// 测试函数

test("/user/","/user")
test("/user/","/user/")
test("/user/","/user/123")

test("/user/:uid","/user/324")
test("/user/:uid","/user/324/123")
test("/user/:uid","/user/324/123")
test("/user/:uid","/user/1234zsd/12312")






// // demo
// const cb = (ctx, next) => { };
// const cb1 = (ctx, next) => { };
// const cb2 = (ctx, next) => { };
// const cb2 = (ctx, next) => { };
// const cbs = [(ctx, next) => { }, (ctx, next) => { }, (ctx, next) => { }]

// var route = new Vector();
// app.use(route.middleware());

// route.get(cbs)
//     .post(cbs)
//     .get(cbs)
//     .next("/api")
//     .befor(cb1)
//     .get(cb2)
//     .after(cb3)
//     .next("/user")
//     .get(cb1)
//     .pos(cb2);
// // demo

