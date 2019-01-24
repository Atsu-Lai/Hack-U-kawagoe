const express = require('express')
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;
const session = require('express-session');
const session_opt = {
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 }
};
const pg = require('pg');
const con = 'postgres://fzzukpvuevabig:1bc548633cfa7b8808185d26e2e25c6b834c4859c24a91a161ff31a69d8dfba9@ec2-54-235-68-3.compute-1.amazonaws.com:5432/dfp3aai94600tp?ssl=true&sslfactory=org.postgresql.ssl.NonValidatingFactory'

app.use(session(session_opt));
app.use(express.static('public'));

app.get('/index', (req,res) => {
  var data ={
      title:'hello',
      content:'てすとやで'
  }
  res.render('index.ejs',data);
});

app.get('/', (req,res) => {
  //login status
  var data ={
      status: false,
  }
  // if (req.session.login == null) {
  //   //login
  //   status: false;
  //   console.log('test');
  // }
    res.render('home.ejs', data);
});

app.get('/test', (req,res) => {
    //login status
    var data ={
        status: false,
    }
    // if (req.session.login == null) {
    //   //login
    //   status: false;
    //   console.log('test');
    // }
      res.render('test.ejs', data);
  });

app.get('/chat', (req,res) => {
    res.render('chat.ejs');
});

app.get('/bbs', (req,res) => {
    res.render('bbs.ejs');
});

app.get('/profile', (req,res) => {
    res.render('profile.ejs');
});
app.get('/login', (req,res) => {
    res.render('login.ejs');
});


io.on('connection',(socket) => {
    console.log(socket.id);
    socket.on('first_location', (data) => {
        io.to(socket.id).emit('conect',{msg:"f-応答"});
        var idomax = data.ido + 0.01;
        var idomin = data.ido - 0.01;
        var keidomax = data.keido + 0.01;
        var keidomin = data.keido - 0.01;
        var timemax = data.timemax;
        var timemin = data.timemin;

        pg.connect(con, (err, client, done) => {
            if(err){
                io.to(socket.id).emit('errors',{er:err});
            }else{
                io.to(socket.id).emit('errors',{er:"f-接続成功"});
            }
            
            client.query("insert into location(name,ido,keido,direction,time,sid) values($1, $2, $3, $4, $5, $6);",
            [data.name, data.ido,data.keido, null, data.time, socket.id], (err,result) => {
                if(err){
                    io.to(socket.id).emit('errors',{er:err});
                }else {
                    io.to(socket.id).emit('errors',{er:"f-書き込み成功"});
                }
            })

            

            client.query('select * from location where direction is null and time between $1 and $2 and ido between $3 and $4 and keido between $5 and $6',
            [timemin,timemax,idomin,idomax,keidomin,keidomax], (err,result) => {
                if(err){
                    io.to(socket.id).emit('errors',{er:"f-読み取り失敗"});
                }else{
                    io.to(socket.id).emit('errors',{er:"f-読み取り成功"});
                    const mdl = result.rows
                    io.to(socket.id).emit('first_list',{val:mdl,sid:socket.id})
                    const list = {
                        sid:socket.id,
                        name:data.name,
                        ido:data.ido,
                        keido:data.keido,
                        direction:null,
                        time:data.time
                    }
                    for(var i in mdl){
                        if(mdl[i].sid != socket.id){
                            console.log(i);
                            console.log(mdl[i].sid);
                            io.to(mdl[i].sid).emit('first_list2',{val:list})
                        }
                    }
                }
            }); 
        });

    })
    socket.on('watch_location', (data)=>{
        io.to(socket.id).emit('conect',{msg:"w-応答"});
        var timemax = data.timemax;
        var timemin = data.timemin;
        var dirmax = data.direction + 1;
        var dirmin = data.direction - 1;

        pg.connect(con, (err, client, done) => {
            console.log('応答');
            if(err){
                io.to(socket.id).emit('errors',{er:"w-接続失敗"});
            }else{
                io.to(socket.id).emit('errors',{er:"w-接続成功"});
            }
            
            client.query("insert into location(name,ido,keido,direction,time,sid) values($1, $2, $3, $4, $5, $6);",
            [data.name, data.ido, data.keido,data.direction, data.time, socket.id], (err,result) => {
                if(err){
                    io.to(socket.id).emit('errors',{er:err});
                }else {
                    io.to(socket.id).emit('errors',{er:"w-書き込み成功"});
                }
            })

            client.query('select * from location where time between $1 and $2 and direction between $3 and $4',
            [timemin,timemax,dirmin,dirmax], (err,result) => {
                if(err){
                    io.to(socket.id).emit('errors',{er:"w-読み取り失敗"});
                }else{
                    io.to(socket.id).emit('errors',{er:"w-読み取り成功"});
                    const mdl = result.rows
                    io.to(socket.id).emit('watch_list',{val:mdl,sid:socket.id})
                    const list = {
                        sid:socket.id,
                        name:data.name,
                        ido:data.ido,
                        keido:data.keido,
                        direction:data.direction,
                        time:data.time
                    }
                    for(var i in mdl){
                        if(mdl[i].sid != socket.id){
                            console.log(i);
                            console.log(mdl[i].sid);
                            io.to(mdl[i].sid).emit('watch_list2',{val:list})
                        }
                    }
                }
            }); 
        });
    })

    socket.on('chat_message', (data) => {
        io.to(data.sid).emit('revers_message',{val:"<li class='left'><span class='username'>@"+ data.myname +"</span><br>" + data.msg + "<a href='#' id ='" + socket.id + data.myname + "' onclick='set_chatid(this)'></a></li>"});
        io.to(socket.id).emit('revers_message',{val:"<li class='right'><span class='username'>to -> "+ data.cname +"</span><br>" + data.msg + "</li>"});
    })

    socket.on('set_status' , (data) => {
        pg.connect(con, (err, client, done) => {
            if(err){
                io.to(socket.id).emit('errors',{er:"s-接続失敗"});
            }else{
                io.to(socket.id).emit('errors',{er:"s-接続成功"});
            }
            client.query("insert into user_status(sid,name,train_na,request,comment,time) values($1, $2, $3, $4, $5, $6);",
            [socket.id, data.name, data.tna, data.req, data.com, data.time], (err,result) => {
                if(err){
                    io.to(socket.id).emit('errors',{er:err});
                }else {
                    io.to(socket.id).emit('errors',{er:"s-書き込み成功"});
                }
            })
        })
    })

    socket.on('send_status', (data) =>{
        io.to(data.sid).emit('status_list',{tna:data.tna, req:data.req, com:data.com, name:data.name, tiem:data.time, sid:socket.id});
    })
})






http.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});
