koa2-routing
================





```javascript

// koa-routing 无法多个实例

// 需要完成这样的用法
var app1= new Koa();
var app2= new Koa();
var app3= new Koa();


var route1 = new Router();
var route2 = new Router();


route1.config();



route1.get("/aaa",(ctx,next)=>{});
route1.all("/ccc",(ctx,next)=>{});
// 等价于
route1.get("/aaa",(ctx,next)=>{})
      .get("/bbb",(ctx,next)=>{});
// 不等价于()
route1.get("/aaa",(ctx,next)=>{})
    .next("/bbb")
    .all("/(*)",(ctx,next)=>{});




var baidu = route1.domain("baidu.com")
baidu.before("中间件")
baidu.get("/asdfasd",[(ctx,next)=>{},(ctx,next)=>{},(ctx,next)=>{}] );
baidu.get("/user",(ctx,next)=>{});
baidu.get("/post",(ctx,next)=>{});
baidu.after("中间件");


var static = route1.domain("static.xyz.com")
// 静态指定
static.all("/static").static("../data/static" ,{
    repleace:[/^\/static/i,"/upload"]
})




var login = route1.domain("login.xyz.com")


// 静态跳转
login.all("/auto/(.*)").redirect("http://autu.test.com");

// 自定义跳转
login.all("/(.*)").redirect(function(ctx,next){
    return "https://login.abc.com/oauth?reurl="+encodeURIComponent(ctx.query["reurl"])
});


// 代理
var proxyrouter = route1.domain("proxy.xyz.com")
proxyrouter.all("/(.*)").proxy("https://baidu.com",{})
proxyrouter.all("/proxy/(.*)").proxy("https://baidu.com",{
    prefix:"/proxy",
    rewrite:[["/api/v1","/api"],[/^\/api([\S])\//,"/$1"]],
})


app1.use(route1.middleware())
app2.user(route1.middleware())
app3.user(route2.middleware())


```