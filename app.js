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
const mysql = require('mysql');
var mysql_setting = {
    host    : 'localhost',
    user    : 'root',
    password: '',
    database: 'train-db',
}
app.use(session(session_opt));
app.use(express.static('public'));

app.get('/', (req,res) => {
  var data ={
      title:'hello',
      content:'てすとやで'
  }
  res.render('index.ejs',data);
});

app.get('/home', (req,res) => {
  //login status
  var status;
  if (req.session.login == null) {
    //login
    status = false;
    console.log('test');
  }
    res.render('home.ejs', status);
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
    socket.on('location_data', (data) => {
        var idomax = data.ido + 0.01;
        var idomin = data.ido - 0.01;
        var keidomax = data.keido + 0.01;
        var keidomin = data.keido - 0.01;
        var timemax = data.timemax;
        var timemin = data.timemin;

        var data = {'name':data.name, 'ido':data.ido, 'keido':data.keido, 'time':data.time, 'socketid':socket.id};
        var connection = mysql.createConnection(mysql_setting);
        connection.connect();
        connection.query('insert into first_location3 set ?', data,(error, results,fields) => {

        });

        connection.query('SELECT * from first_location3 where ido<=? and ido>=? and keido<=? and keido>=? and time<=? and time>=?',
        [idomax,idomin,keidomax,keidomin,timemax,timemin],(error, results,fields) => {
            io.to(socket.id).emit('userlist',{val:results})
            const list = {
                id:socket.id,
                name:data.name,
                ido:data.ido,
                keido:data.keido,
                time:data.time
            }
            for(var i in results){
                io.to(results[i].socketid).emit('userlist2',{val:list})
            }
        });

        connection.end();

    })
})






http.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});
