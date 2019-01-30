var express = require('express');
var app = express();
var sharedsession = require("express-socket.io-session");
var server = require('http').Server(app);
var io = require('socket.io')(server,{origins:'*:*'});
var session = require("express-session")({
  secret:"1234",
  resave:true,
  saveUninitialized: true
});
var mysql = require('mysql');
var con = mysql.createConnection({
  //host: "localhost",
  host: "85.251.91.132",
  user: "samuel",
  password: "Samuel_1",
  database: "guinote"
});

var turno = ['true','false'];

/*app.get('/', function(req, res){
  res.sendFile(__dirname + '/prueba.html');
});*/

app.use(session);
io.use(sharedsession(session,{
  autoSave:true
}));

io.origins('*:*');

io.on('connection', function(socket)
{
  socket.on('conectarUsuario', function(data)
  {
    //console.log(data);
    //console.log(data.id_user);
    socket.handshake.session.idUser = data.id_user;
    socket.handshake.session.save();
    numConectados = 0;
    con.connect(function(err)
    {
      //if (err) throw err;
      con.query("UPDATE usuario SET estado='conectado' WHERE id_usuario="+data.id_user+";", function (err, result, fields) {
      //if (err) throw err;
      //console.log(result);
      });
      con.query("SELECT count(*) as data FROM usuario WHERE estado='conectado';").on('result',function(result)
      {
        //numConectados = data.data;
        io.sockets.emit("usuario_conectado", {"id":socket.handshake.session.idUser,"nombre":data.nombre_user , "numConectados" : result.data });
      });
    });
    //console.log(numConectados); 
    /*socket.broadcast.emit*/
    //io.sockets.emit("usuario_conectado", {"id":socket.handshake.session.idUser,"nombre":data.nombre_user , "numConectados" : numConectados });
  });

  socket.on('disconnect', function()
  {
    numConectados = 0;
    con.connect(function(err)
    {
      if(socket.handshake.session.idUser)
      {
        //if (err) throw err;
        con.query("UPDATE usuario SET estado='desconectado' WHERE id_usuario="+socket.handshake.session.idUser+";", function (err, result, fields) {
        //if (err) throw err;
        //console.log(result);
        });
        con.query("SELECT count(*) as data FROM usuario WHERE estado='conectado';").on('result',function(result)
        {
          //console.log(socket.handshake.session.idUser);
          //console.log(result.data);
          io.sockets.emit("usuario_desconectado", {"id" : socket.handshake.session.idUser, "numConectados" : result.data });
        });
      }
    });  
  });

  socket.on('enviarMensaje', function(data)
  {
    socket.broadcast.emit("chatMensaje",data);
  });

  socket.on('conectarSala', function(data)
  {
    socket.join(data);
  });

    socket.on('comprobarUsuariosSala',function(data){
      socket.join(data);
      var clients = io.sockets.adapter.rooms[data].length;
    if(clients > 2)
    {
      socket.leave(data);
      socket.emit("limiteUsuarios","true");
    }
    else
    {
      socket.emit("jugadorNumero",clients);
      console.log("conectado a la sala"+data);
    }
    });

    socket.on('repartircarta',function(data)
    {
      if(data.mostrar)
      {
        socket.in(data.sala).emit("cartaRival",{carta:data.carta,mostrar:true});
      }
      else
      {
        socket.in(data.sala).emit("cartaRival",{carta:data.carta,mostrar:false});
      }
      console.log(data);
    });

    socket.on('colocarMonton',function(data)
    {
      socket.in(data.sala).emit("colocarMonton",{carta:data.carta});
    });

    socket.on('comprobarUsuariosListos',function(data){
      var clients = io.sockets.adapter.rooms[data].length;
      console.log(clients);
    if(clients == 2)
    {
      io.in(data).emit("usuariosListos","true");
    }
    });

    socket.on('moverCarta',function(data)
    {
      console.log(data);
      socket.in(data.sala).emit("moverCartaRival",data.carta);
    });

    socket.on('pasarTurno',function(data)
    {
      socket.in(data.sala).emit("cambioTurno");
    });

    socket.on('limpiarTablero',function(data)
    {
        var ms=1000;
        var start = new Date().getTime();
        var end = start;
        while(end < start + ms) 
        {
            end = new Date().getTime();
        }
      io.in(data.sala).emit("limpiarTablero");
    });

    socket.on('eliminarMonton',function(data)
    {
      socket.in(data.sala).emit("eliminarMonton");
    });

    socket.on('mostrarTxtTurno',function(data)
    {
      socket.in(data.sala).emit("mostrarTextoTurno",data.turno);
    });

    socket.on('prepararRonda',function(data)
    {
      io.in(data.sala).emit("iniciarNuevaRonda");
    });

    socket.on('mostrarResultadosPartida',function(data)
    {
      io.in(data.sala).emit("mostrarResultadosPartida");
    });

    socket.on('vaciarArray',function(data)
    {
      socket.in(data.sala).emit("vaciarArray",data.turno);
    });

    socket.on('cambioSiete',function(data)
    {
      socket.in(data.sala).emit("cambiarSiete",data.carta);
    });

    socket.on('cantar',function(data)
    {
      socket.in(data.sala).emit("cantar",{puntos:data.puntos,txt:data.txt});
    });

    socket.on('generarBaraja',function(data)
    {
      socket.in(data.sala).emit("generarBaraja");
    });

    socket.on('finalizarArrastre',function(data)
    {
      socket.in(data.sala).emit("finalizarArrastre",{victoria:data.victoria});
    });

    socket.on('sumarDiezUltimas',function(data)
    {
      socket.in(data.sala).emit("sumarDiezUltimas");
    });

});

server.listen(8080, function(){
  console.log('listening on *:8080');
});