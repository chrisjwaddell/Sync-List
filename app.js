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
  let json;

  try {
    json = await services.putBuild(req.body)
    // console.log("app.js after putBuild")
  } catch(err) {
    // console.error("putBuild error")
    console.error(err)
    json = {}
  }

  res.json(req.body);
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


