const express = require("express");
const path = require("path");
const cors = require("cors");
const app = express();

const { expressjwt: jwt } = require("express-jwt");
const jwks = require("jwks-rsa");
const bodyParser = require("body-parser");
const db = require("./database/models");
const Mensaje = db.Mensaje;
const http = require("http"); // Cambia 'require("http").createServer' a 'require("http")'
const userApi = require("./api/userApi");
const mascotaApi = require("./api/mascotaApi");
const mensajesApi = require("./api/mensajesApi");
const io = require("socket.io"); // Cambia 'require("socket.io")(server, ...)' a 'require("socket.io")(http, ...)'

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());

const PORT = 4000; // Cambia el puerto a 4000 para WebSocket

// Cambia 'server.listen(4000);' a 'http.createServer(app).listen(PORT);'
http.createServer(app).listen(PORT);

app.use("/", userApi);
app.use("/", mascotaApi);
app.use("/", mensajesApi);

const socketServer = io(http); // Cambia 'io(server, ...)' a 'io(http, ...)'

socketServer.on("connection", (socket) => {
  socket.on("message", (body, idEmisor, idReceptor, nombreEmisor) => {
    console.log("DATOS DESDE APP", body);
    socket.broadcast.emit("message", {
      body,
      from: socket.id.slice(8),
    });
    const objetoFecha = Date.now();
    const nowDate = new Date(objetoFecha);
    let fechaMensaje = nowDate.toLocaleDateString("en-ZA");

    Mensaje.create({
      mensaje: body.body,
      emailEmisor: body.emailEmisor,
      emailReceptor: body.idReceptor,
      fechaMensaje: fechaMensaje,
      nombreEmisor: body.nombreEmisor,
    });
  });
  console.log("Socket.io connected"); // Agrega un registro de conexión para verificar
});

console.log("servidor ON en puerto:", PORT); // Mueve este registro fuera de la función de escucha de app
