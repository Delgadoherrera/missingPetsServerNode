const express = require("express");
const path = require("path");
const cors = require("cors");
const app = express();

const { expressjwt: jwt } = require("express-jwt");
const jwks = require("jwks-rsa");
const bodyParser = require("body-parser");
const db = require("./database/models");
const Mensaje = db.Mensaje;
const server = require("http").createServer(app);
const userApi = require("./api/userApi");
const mascotaApi = require("./api/mascotaApi");
const mensajesApi = require("./api/mensajesApi");
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());
server.listen(4000);
const corsOptions = {
  origin: "https://localhost", // Aquí debes especificar el origen permitido
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use("/", userApi);
app.use("/", mascotaApi);
app.use("/", mensajesApi);

io.on("connection", (socket) => {
  socket.on("message", (body, idEmisor, idReceptor) => {
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
    });
  });
});

/* const PORT = process.env.port */
const PORT = 3001;

app.listen(PORT, () => {
  console.log("servidor ON sen puerto: ", PORT);
});
