const express = require("express"), app = express(), fs = require("fs"), services = require("./services"), cors = require("cors"), hostname = "localhost", port = 21311;

var settings = "";

app.use(express.urlencoded({
    extended: !0
})), app.use(express.json()), app.use(cors()), app.get("/", async function(req, res) {
    console.log("=====================================================================");
    try {
        let r = await services.getSettings();
        res.json(r);
    } catch (err) {
        console.error(err);
    }
}), app.put("/", async function(req, res) {
    console.log("====================================================================="), 
    settings = req.body;
    let json = await services.putSettings(settings);
    res.json(json);
}), app.put("/build", async function(req, res, next) {
    console.log("=====================================================================");
    let json;
    try {
        json = await services.putBuild(req.body);
    } catch (err) {
        console.error("putBuild error"), json = "";
    }
    res.send(req.body);
}), app.use((req, res, next) => {
    const error = new Error("Not found");
    error.status = 404, next(error);
}), app.use((error, req, res, next) => {
    console.log(error), res.status(error.status || 500).send({
        error: {
            status: error.status || 500,
            message: error.message || "Internal Server Error"
        }
    }), process.exit(1);
}), app.listen(port, () => {
    console.log("====================================================================="), 
    console.log("Backup app listening on port ", port);
});