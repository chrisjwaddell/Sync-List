const express = require('express')
const app = express()

// const fs = require('fs');
const fsp = require('fs/promises');

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


app.get('/', async function(req, res) {
//* A get request is submitted from the frontened GUI at the start to get the settings
//* We send back settings.json to it since the frontend can't read files on the computer, but Node can

  console.log("=====================================================================")
  console.log("remove fsp")

  // services.scriptsFolder3()

  try {
    let r = await services.getSettings()
    // console.log(JSON.parse(r))
      res.json(r)
    // res.send(JSON.stringify(r))
    } catch (err) {
      console.error(err)
    }
})


app.put('/', async function(req, res) {
//* Put requests update json from the frontend and writes to the settings.json file
//* It gets the json data from the body of the request

console.log("=====================================================================")

settings = req.body

let json = await services.putSettings(settings)

res.json(json)

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
  // console.log(typeof(req.body))
  let json;

  try {
    json = await services.putBuild(req.body)
    // console.log("app.js after putBuild")
    // console.log(typeof json)
  } catch(err) {
    // console.error("putBuild error")
    // console.error(err)
    // json = {}
  }

  // console.log("in app.js - /build - json")

  // let s = JSON.stringify(json)
  // let s = await JSON.stringify(json)
  // console.log(typeof json)
  // console.log(s)
  // console.log(typeof s)

  // console.log(req.body)
  // res.send(req.body)
  // res.send(json)
  // res.json(req.body)
  // res.json(json)
  // console.log(s)
  // res.send(json)

  // res.json(json)

  // console.log(typeof req.body)
  // console.log(typeof json)

  res.json(req.body);
})

app.put('/testjsonjson', async function(req, res) {
  let json = req.body
  // console.log("req.body - ")
  // console.log(req.body)

  await fsp.writeFile("E:\\wamp64\\www\\Websites-I-Did\\Sync-Listaaa\\Backup-scripts\\test.ps1", "test").then( r => {
    debugger
    console.log("f")
    console.log("result")
    res.json(json)
    // return result;
  })
  .catch(err => console.log("ERROR"))

})


app.put('/testjsontext', async function(req, res, next) {
  let json = req.body
  console.log("req.body - ")
  console.log(req.body)

  res.send("Hello")
})


app.put('/test', async function(req, res, next) {
  console.log("=====================================================================")
  console.log(typeof(req.body))
  let json

  try {
    // json = await services.test(req.body)
    json = await services.putBuild(req.body)

  } catch(err) {

}

  res.json(req.body)
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


