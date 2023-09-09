const express = require("express");
const multer = require("multer");
const cors = require("cors");
const router = express.Router();
const path = require("path");
const db = require("../database/models");
const Mascota = db.Mascota;
const MascotaEncontrada = db.MascotaEncontrada;
const jwt = require("jsonwebtoken");
var Sequelize = require("sequelize");
const Op = Sequelize.Op;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../public/img/pets"));
  },
  filename: (req, file, cb) => {
    /*    console.log(file); */
    const newFilename = "file" + Date.now() + path.extname(file.originalname);
    cb(null, newFilename);
    req.session.newFileName = newFilename;
  },
});
const upload = multer({ storage });

const gradosARadianes = (grados) => {
  return (grados * Math.PI) / 180;
};

const distanciaCoords = (lat1, lon1, lat2, lon2) => {
  lat1 = gradosARadianes(lat1);
  lon1 = gradosARadianes(lon1);
  lat2 = gradosARadianes(lat2);
  lon2 = gradosARadianes(lon2);

  const radioTierra = 6371;
  let difLng = lon2 - lon1;
  let difLat = lat2 - lat1;
  let a =
    Math.pow(Math.sin(difLat / 2.0), 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(difLng / 2.0), 2);
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radioTierra * c;
};

router.post("/mascota/register", (req, res) => {
  console.log(req.body);
  const sent = req.body.formData;
  Mascota.create({
    nombre: sent.nombre,
    emailMascota: req.body.user,
    colorPrimario: sent.colorPrimario,
    colorSecundario: sent.colorSecundario,
    pesoAproximado: sent.peso,
    status: 0,
    tipoMascota: sent.tipoMascota,
    descripcion: sent.descripcion,
    fotoMascota: req.body.file,
    geoAdress: "No está perdida",
  });
  res.status(200).send();
});

router.get("/mascotas/getById/:id", async (req, res) => {
  /*   console.log(req);
  await Mascota.findAll({
    where: {
      idHumano: req.params.id,
      status: { [Op.ne]: 3 },
    },
  }).then(
    await function (mascotas) {
      return res.status(200).send({ data: mascotas });
    }
  ); */
  return res.status(200).send({ holamanola: "CONECTADO" });
});

router.post("/mascotas/mascotaPerdida/:id", async (req, res) => {
  console.log(req.body);
  Mascota.update(
    {
      latPerdida: req.body.coords[0],
      lngPerdida: req.body.coords[1],
      geoAdress: "lugarEncontrada",

      status: 1,
    },
    {
      where: { idMascota: req.params.id },
    }
  ).catch((error) => res.send(error));
  res.status(200).send();
});

router.post("/mascotas/mascotaPerdidaNewLocation/:id", async (req, res) => {
  console.log(req.body);

  let lugarEncontrada = req.body.lugarEncontrado.join(",");

  /*   Mascota.update(
    {
      latPerdida:
        req.body.sendLocation[req.body.sendLocation.length - 1].latitude,
      lngPerdida:
        req.body.sendLocation[req.body.sendLocation.length - 1].longitude,
      geoAdress: 'lugarEncontrada',

      status: 1,
    },
    {
      where: { idMascota: req.params.id },
    }
  ).catch((error) => res.send(error)); */
  res.status(200).send();
});

router.get("/mascotas/mascotaEncontrada", async (req, res) => {
  console.log(req.body);

  MascotaEncontrada.findAll({
    where: {
      status: 1,
    },
  })
    .then(function (encontradas) {
      if (encontradas) {
        return res.status(200).send({ data: encontradas });
      } else if (!encontradas) {
        console.log("No se han encontrado mascotas perdidas por tu zona");
        return res.status(400);
      }
    })
    .catch((error) => {
      console.log("error catch" + error);
    });
});

router.post("/mascotas/nuevaMascotaPerdida", async (req, res) => {
  console.log(req.body);

  await Mascota.create({
    nombre: "",
    emailMascota: req.body.body.email,
    colorPrimario: req.body.body.value.colorPrimario,
    colorSecundario: req.body.body.value.colorSecundario,
    pesoAproximado: req.body.body.value.peso,
    status: 3,
    tipoMascota: req.body.body.value.tipoMascota,
    descripcion: req.body.body.value.descripcion,
    fotoMascota: req.body.body.image,
    latPerdida: req.body.body.position[0],
    lngPerdida: req.body.body.position[1],
    geoAdress: "lugarEncontrada",
  });
  res.status(200).send();
});
router.post(
  "/mascotas/mascotaEncontrada/:id",
  upload.single("file"),
  async (req, res) => {
    console.log(req.body);
    console.log(req.headers);

    Mascota.update(
      {
        status: 0,
        latPerdida: 0,
        lngPerdida: 0,
      },
      {
        where: { idMascota: req.params.id },
      }
    );
    res.status(200).send();
  }
);

router.post("/mascotas/borrarMascota/:id", async (req, res) => {
  await Mascota.destroy({
    where: {
      idMascota: req.params.id,
    },
  });

  res.status(200).send("success");
});

router.post("/mascotas/editarMascota/:id", async (req, res) => {
  console.log("req.body", req.body);
  let sent = req.body.formData;
  await Mascota.update(
    {
      nombre: sent.nombre,
      colorPrimario: sent.colorPrimario,
      colorSecundario: sent.colorSecundario,
      pesoAproximado: sent.pesoAproximado,
      tipoMascota: sent.tipoMascota,
      descripcion: sent.descripcion,
    },
    {
      where: {
        idMascota: req.params.id,
      },
    }
  );

  res.status(200).send("success");
});

// NEW DESIGN

router.get("/mascotas/getMyPets/:email", async (req, res) => {
  console.log(req.params.email);
  await Mascota.findAll({
    where: {
      emailMascota: req.params.email,
      status: { [Op.ne]: 3 },
    },
  }).then(
    await function (mascotas) {
      console.log("user Pets", mascotas);
      return res.status(200).send({ data: mascotas });
    }
  );
});

router.get("/mascotas/mascotasPerdidas", async (req, res) => {
  console.log("REQSASSSSS", req.body, req.headers);
  console.log("distance", req.headers.distanceslider);
  const mascotasCercanas = [];
  await Mascota.findAll({
    where: { status: { [Op.in]: [1, 3] } },
  })
    .then(function (mascotas) {
      if (mascotas) {
        mascotas.forEach((j) => {
          let distance = distanciaCoords(
            req.headers.latitude,
            req.headers.longitude,
            j.latPerdida,
            j.lngPerdida
          );

          if (distance < req.headers.distanceslider) {
            /*             console.log(j.nombre, "esta cerca!");
             */ mascotasCercanas.push(j);
          } else {
            console.log("aun no hay mascotas cerca");
          }

          /* console.log('distance', distance) */
        });
        console.log(
          "MASCOTAS ENCONTRADAS: ",
          mascotasCercanas.length,
/*           mascotasCercanas
 */        );
        if (mascotasCercanas.length > 0) {
          return res.status(200).send({ data: mascotasCercanas });
        } else if (mascotasCercanas.length < 1) {
          Mascota.findAll({
            where: { status: { [Op.in]: [1, 3] } },
          }).then(function (mascotas) {
            console.log("MASCOTAS NO ENCCONTRADA: ", /* mascotasCercanas */);
            return res.status(200).send({ data: mascotasCercanas });
          });
        }
      }
    })
    .catch((error) => {
      console.log("error catch" + error);
    });
});

router.post("/mascotas/adopcion/:id", async (req, res) => {
  console.log(req.body);

  if (req.body.adoptar === true) {
    Mascota.update(
      {
        status: 4,
        latPerdida: req.body.latitude,
        lngPerdida: req.body.longitude,
      },
      {
        where: { idMascota: req.params.id },
      }
    ).catch((error) => res.send(error));
  } else if (req.body.adoptar === false) {
    Mascota.update(
      {
        status: 0,
      },
      {
        where: { idMascota: req.params.id },
      }
    ).catch((error) => res.send(error));
  }

  res.status(200).send("success");
});
router.get("/mascotas/mascotasEnAdopcion", async (req, res) => {
  console.log("mascotas en adopcion:::", req.body, "headers:", req.headers);
  const mascotasCercanas = [];
  Mascota.findAll({
    where: { status: 4 },
  })
    .then(function (mascotas) {
      if (mascotas) {
        mascotas.forEach((j) => {
          let distance = distanciaCoords(
            req.headers.latitude,
            req.headers.longitude,
            j.latPerdida,
            j.lngPerdida
          );

          if (distance < req.headers.distanceslider) {
            console.log(j.nombre, "esta cerca!");
            mascotasCercanas.push(j);
          } else {
            console.log("aun no hay mascotas cerca");
          }
        });
        if (mascotasCercanas.length > 0) {
          return res.status(200).send({ data: mascotasCercanas });
        } else if (mascotasCercanas.length < 1) {
          Mascota.findAll({
            where: { status: 4 },
          }).then(function (mascotas) {
            return res.status(200).send({ data: mascotas });
          });
        }
      }
    })
    .catch((error) => {
      console.log("error catch" + error);
    });
});

router.post("/mascotas/startAdoption/:id", async (req, res) => {
  console.log("req.param", req.params.id);
  await Mascota.update(
    {
      status: 4,
    },
    {
      where: {
        idMascota: req.params.id,
      },
    }
  );
  res.status(200).send("success");
});

router.post("/mascotas/quitAdoption/:id", async (req, res) => {
  console.log("req.param", req.params.id);
  await Mascota.update(
    {
      status: 0,
    },
    {
      where: {
        idMascota: req.params.id,
      },
    }
  );
  res.status(200).send("success");
});

router.post("/mascotas/stopSearch/:id", async (req, res) => {
  console.log("req.param", req.params.id);
  await Mascota.update(
    {
      status: 0,
    },
    {
      where: {
        idMascota: req.params.id,
      },
    }
  );
  res.status(200).send("success");
});

module.exports = router;

//mascota status 4 = en adopcion
