const Koa = require("koa");
const Vector = require("./vector");



const before = async (ctx,next)=>{
    let start = new Date()
    await next();
    console.log(`>>>>>>>>>>`+new Date()-start)
}

const after = async (ctx,next)=>{
    console.log(`<<<<<<<<<<${ctx.path}`);
    await next();
}


const bbb = async (ctx,next)=>{
    ctx.body = "hello world!"
}

const ccc = async (ctx,next)=>{
    console.log(`IP:${ctx.ip} browse ${ctx.path}`);
    ctx.body =`Hello koa2!\r\n "commonHandler" \r\n You ip:${ctx.ip} browse ${ctx.path}`
};

const ddd = async (ctx,next)=>{
    console.log(ctx.request.params)
    ctx.body =`Hello koa2! \r\n "paramsHandler" \r\n You ip:${ctx.ip} browse ${ctx.path}`
};

const root = new Vector();

root.before(before)
    .get(bbb)
    .post(bbb)
    .after(after)
var user = root.next("/user");
user.next("/login").all(bbb);
user.next("/logout").get(bbb);
user.next("/(.*)").all(ddd)

var post = root.next("/post");
post.get(ccc).post(ccc);
var ppp = post.next("/:pid");
ppp.get(ddd);
ppp.next("/:wid").get(ddd)
ppp.next("/(.*)").all(ddd)
    

const app = new Koa();
app.use(root.middleware());
app.listen("9090","0.0.0.0");

const app2 = new Koa();
app2.use(user.middleware());
app2.listen("8080","0.0.0.0");

const app3 = new Koa();
app3.use(post.middleware());
app3.listen("7070","0.0.0.0");

console.log("http://127.0.0.1:9090/")