const express = require('express')
const app = express()

const fs = require('fs');
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


app.get('/test', async function(req, res) {
  console.log("test")
  fs.readFile('./zicons.json', 'utf8', function (err,data) {

    if (err) {
      // next(err) // Pass errors to Express.
      throw new Error("Something went wrong!");
    } else {
      // console.log(data);
      // res.send('this is homepage')
      res.json(data)
    }
  });

})

app.get('/test2', async function(req, res) {
  console.log("test")
  fs.readFile('./zicons1.json', 'utf8', function (err,data) {

    if (err) {
      // next(err) // Pass errors to Express.
      throw new Error("Something went wrong!");
    } else {
      console.log(data.substring(0,100));
      // res.send('this is homepage')
      res.send(data)
    }
  });

})

app.get('/testjson', async function(req, res) {
  console.log("test")
  fs.readFile('./zicons1.json', 'utf8', function (err,data) {

    if (err) {
      // next(err) // Pass errors to Express.
      throw new Error("Something went wrong!");
    } else {
      console.log(data.substring(0,100));
      // res.send('this is homepage')
      res.send(data)
    }
  });

})


app.get('/', async function(req, res) {
// A get request is submitted from the frontened GUI at the start to get the settings
// We send back settings.json to it since the frontend can't read files on the computer, but Node can

  console.log("=====================================================================")

  console.log("get")
  debugger
  // services.scriptsFolder3()

  try {
    let r = await services.getSettings()
    // console.log("in get after await")
    // console.log(r)
    // console.log(typeof r)
    // console.log(JSON.parse(r))
    res.json(r)
    // res.send(JSON.stringify(r))
    } catch (err) {
      console.error(err)
    }
  // console.log(g)
  // services.scriptsDirAndSettingsFile()
  console.log("here")
  return
  fsp.readFile('./settings.json', 'utf8', function (err,data) {

    if (err) {
      // next(err) // Pass errors to Express.
      throw new Error("Something went wrong!");
    } else {
      // console.log(data);
      // res.send('this is homepage')
      res.send(data)
    }
  });

})

app.put('/', async function(req, res) {
// Put requests update json from the frontend and writes to the settings.json file
// It gets the json data from the body of the request

console.log("=====================================================================")

settings = req.body

let json = await services.putSettings(settings)

res.json(json)

return

})


app.put('/build', async function(req, res, next) {
  console.log("=====================================================================")

  let json = await services.putBuild(req.body)
  console.log("return build")
  console.log(json)

  res.send(req.body)
})


app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

// error handler middleware
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


