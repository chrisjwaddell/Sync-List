const express = require('express')
const app = express()

const fs = require('fs');

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

app.get('/', function(req, res) {
// A get request is submitted from the frontened GUI at the start to get the settings
// We send back settings.json to it since the frontend can't read files on the computer, but Node can
  console.log("get")

  fs.readFile('./settings.json', 'utf8', function (err,data) {
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
 console.log("put")
//  console.log(req)
//  console.log(JSON.stringify(await (req.header)))
//  console.log(req.headers)
//  console.log(req.body)
settings = req.body
// console.log(settings)
// console.log(__dirname)
// console.log(__dirname + '\\' + 'settings.json')
let strjson = await JSON.stringify(settings, null, 4)

  fs.writeFile(__dirname + '\\' + 'settings.json', strjson, (err) => {
    if (err) {
      console.log("xxx")
      console.error(err)
      return
    }
    //file written successfully
    console.log("file written to")
  })

 res.send("got it")
})

app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  exit(1)
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
  });

app.listen(port, () => {
  console.log("Backup app listening on port ", port)
})


