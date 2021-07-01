const express = require('express')
const app = express()

// const fs = require('fs');
// const fsp = require('fs/promises');

const services = require('./services');

const cors = require('cors');
// const { exit, send } = require('process');

const hostname = 'localhost'
const port = 21311

var settings = ""

app.use(
  express.urlencoded({
    extended: true
  })
)
app.use(express.json());

app.use(cors())

app.get('/test2', function(req, res) {
  console.log("test2")
  services.test2()
  console.log("after test2()")
  console.log("after test2() 2")
})


app.get('/', function(req, res) {
  //* A get request is submitted from the frontened GUI at the start to get the settings
  //* We send back settings.json to it since the frontend can't read files on the computer, but Node can

    console.log("=====================================================================")

    services.getSettings()
      .then(i => {
        // settings file read successfully, return the data
        // console.log(i)
        // console.log(typeof i)
        res.send(i)
      })
      .catch(err => {
        // console.log("app.js - catch - err - ")
        console.error("ERROR:  " + err)
        if (err === "Settings file not found") {
          console.log("Settings not found")
          services.newSettings().then(v => {
            // console.log(v);
            res.send(v)
          })

          // console.log(g)
          // services.newSettings()

        } else {
          let sr = services.settingsBackup()
            .then(r => {
              console.log("after settingsBackup - then")
              services.newSettings()
                .then(v => {
                  console.log("after settingsBackup & newSettings - then")
                  console.log(v)
                  // console.log(v);
                  res.send(v)
                })
                .catch(err => {
                  console.log("after settingsBackup & newSettings - catch")
                  res.send( { "Backup List":[], "Script message": err, "Important Error Message": err })
                })
            })
            .catch(err => {
              console.log("after settingsBackup - catch")
              console.log(err)
              res.send( { "Backup List":[], "Script message": err, "Important Error Message": err })
            })
            // Scripts directory doesn't exist and couldn't be created.
            // Couldn't read settings file.
        }

        // newFile = await newSettings()
      })

})

app.get('/x', async function(req, res) {
//* A get request is submitted from the frontened GUI at the start to get the settings
//* We send back settings.json to it since the frontend can't read files on the computer, but Node can

  console.log("=====================================================================")

  // services.scriptsFolder3()

  try {
    let r = await services.getSettings()
    // console.log(JSON.parse(r))
      res.json(r)
    // res.send(JSON.stringify(r))
    } catch (err) {
      console.error(err)
      // send different things depending on message
      res.json({})
    }
})


app.put('/', async function(req, res) {
//* Put requests update json from the frontend and writes to the settings.json file
//* It gets the json data from the body of the request
console.log("=====================================================================")
console.log("putsettings")

settings = req.body

// console.log("typeof settings")
// console.log(typeof settings)
// res.send(settings)

services.putSettings(settings)
.then(j => {
  console.log("j")
  console.log(j)
  console.log(typeof j)
  res.send(j)
})
.catch(err => {
  console.log(err)
  res.send("")
})

})


app.put('/test2', async function(req, res) {
  console.log("=====================================================================")
  console.log(typeof(req.body))
  let json

  try {
    // json = await services.test(req.body)
    json = await services.test(req.body)

  } catch(err) {
    console.log(err)
  }
  res.json(req.body)
})


app.put('/build', async function(req, res) {
  console.log("=====================================================================");
  console.log("/build")
  let json;

  // let w = services.putBuild(req.body).then(v => {
  //   console.log(v)
  //   console.log("v")
  // })

  await services.putBuild(req.body)
    // .then(j => j.json())
    // .then(s => console.log(s))
  // .then(r => console.log("xxx" + r))
  .then(j => {

    console.log("jj")
    console.log(j)
  //   console.log(typeof j)
    res.send(j)
 })
  .catch(err => {
    console.log(err)
    console.error(err)
    res.send("")
    //   res.sendStatus(500).send(json);
  })

})


app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
})

//* error handler middleware
app.use((error, req, res, next) => {
  console.log(error)
  res.status(error.status || 500).send({
    error: {
      status: error.status || 500,
      message: error.message || 'Internal Server Error',
    },
  });
  process.exit(1)
});

app.listen(port, () => {
  console.log("=====================================================================")
  console.log("Backup app listening on port ", port)
})


