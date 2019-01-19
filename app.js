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
/*
const options = {};
const pgp =require("pg-promise")(options);
const connection = {
    host: 'ec2-54-235-68-3.compute-1.amazonaws.com',
    port: 5432,
    database: 'dfp3aai94600tp',
    user: 'fzzukpvuevabig',
    password: '1bc548633cfa7b8808185d26e2e25c6b834c4859c24a91a161ff31a69d8dfba9'
};
const db = pgp(connection);

const mysql = require('mysql');
var mysql_setting = {
    host    : 'localhost',
    user    : 'root',
    password: '',
    database: 'train-db',
} 
const knex = require('knex')({
    dialect: 'postgresql',
    //dialect: 'mysql',
    connection: {
        host    : 'ec2-54-235-68-3.compute-1.amazonaws.com',
        user    : 'fzzukpvuevabig',
        password: '1bc548633cfa7b8808185d26e2e25c6b834c4859c24a91a161ff31a69d8dfba9',
        database: 'dfp3aai94600tp',
        charset : 'utf8'
    }
});
const Bookshelf = require('bookshelf')(knex);
const FL = Bookshelf.Model.extend({
    tableName: 'location'
});
*/
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
        var idomax = data.ido + 0.01;
        var idomin = data.ido - 0.01;
        var keidomax = data.keido + 0.01;
        var keidomin = data.keido - 0.01;
        var timemax = data.timemax;
        var timemin = data.timemin;

        pg.connect(con, (err, client, done) => {
            if(err){
                io.to(socket.id).emit('errors',{er:"接続失敗"});
            }else{
                io.to(socket.id).emit('errors',{er:"接続成功"});
            }
            
            client.query("insert into location(name,ido,keido,direction,time,sid) values($1, $2, $3, $4, $5, $6);",
            [data.name, data.ido,data.keido, null, data.time, socket.id], (err,result) => {
                if(err){
                    io.to(socket.id).emit('errors',{er:err});
                }else {
                    io.to(socket.id).emit('errors',{er:"書き込み成功"});
                }
            })

            

            client.query('select * from location where direction is null and time between $1 and $2 and ido between $3 and $4 and keido between $5 and $6',
            [timemin,timemax,idomin,idomax,keidomin,keidomax], (err,result) => {
                if(err){
                    io.to(socket.id).emit('errors',{er:"読み取り失敗"});
                }else{
                    io.to(socket.id).emit('errors',{er:"読み取り成功"});
                    const mdl = result.rows
                    io.to(socket.id).emit('first_list',{val:mdl,id:socket.id})
                    const list = {
                        id:socket.id,
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
/*
        db.any("insert into location(name,ido,keido,time,sid) values($!, $2, $3, $4, $5);",[data.name, data.ido, data.keido, data.time, socket.id]).
        then((data) =>{
            console.log(data);
        })
        .catch((error) => {
            console.log(error);
            io.to(socket.id).emit('errors',{er:error});
        })

        db.any("select * from location where time between $1 and $2", [timemin,timemax]).
        then((data) =>{
            const mdl = data.rows
            io.to(socket.id).emit('userlist',{val:mdl,id:socket.id})
            const list = {
                id:socket.id,
                name:data.name,
                ido:'"' + data.ido + '"',
                keido:'"' + data.keido + '"',
                time:data.time
            }
            for(var i in mdl){
                if(mdl[i].sid != socket.id){
                    console.log(i);
                    console.log(mdl[i].sid);
                    io.to(mdl[i].sid).emit('userlist2',{val:list})
                }
            }
            console.log(data);
        })
        .catch((error) => {
            console.log(error);
        })
        
        var data = {name:data.name, ido:data.ido, keido:data.keido, time:data.time, sid:socket.id};

        new FL(data).save().then((model) => {

        });

        new FL().where('ido','<=',idomax).where('ido','>=',idomin)
        .where('keido','<=',keidomax).where('keido','>=',keidomin)
        .where('time','<=',timemax).where('time','>=',timemin).fetchAll().then((model) =>{
            const mdl = model.toArray()
            io.to(socket.id).emit('userlist',{val:mdl,id:socket.id})
            const list = {
                id:socket.id,
                name:data.name,
                ido:'"' + data.ido + '"',
                keido:'"' + data.keido + '"',
                time:data.time
            }
            for(var i in mdl){
                if(mdl[i].attributes.sid != socket.id){
                    console.log(i);
                    console.log(mdl[i].attributes.sid);
                    io.to(mdl[i].attributes.sid).emit('userlist2',{val:list})
                }

            }
        }) */
    })
    socket.on('watch_location', (data)=>{
        console.log('watch!!');
        var timemax = data.timemax;
        var timemin = data.timemin;
        var dirmax = data.direction + 1;
        var dirmin = data.direction - 1;

        pg.connect(con, (err, client, done) => {
            if(err){
                io.to(socket.id).emit('errors',{er:"接続失敗"});
            }else{
                io.to(socket.id).emit('errors',{er:"接続成功"});
            }
            
            client.query("insert into location(name,ido,keido,direction,time,sid) values($1, $2, $3, $4, $5, $6);",
            [data.name, data.ido, data.keido,data.direction, data.time, socket.id], (err,result) => {
                if(err){
                    io.to(socket.id).emit('errors',{er:err});
                }else {
                    io.to(socket.id).emit('errors',{er:"書き込み成功"});
                }
            })

            client.query('select * from location where time between $1 and $2 and direction between $3 and $4',
            [timemin,timemax,dirmin,dirmax], (err,result) => {
                if(err){
                    io.to(socket.id).emit('errors',{er:"読み取り失敗"});
                }else{
                    io.to(socket.id).emit('errors',{er:"読み取り成功"});
                    const mdl = result.rows
                    io.to(socket.id).emit('watch_list',{val:mdl,id:socket.id})
                    const list = {
                        id:socket.id,
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
})






http.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});
