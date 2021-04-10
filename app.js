const express = require("express");

const app = express();

const fs = require("fs");

const services = require("./services");

const cors = require("cors");

const hostname = "localhost";

const port = 21311;

var settings = "";

app.use(express.urlencoded({
    extended: true
}));

app.use(express.json());

app.use(cors());

app.get("/", async function(s, e) {
    console.log("=====================================================================");
    try {
        var o = await services.getSettings();
        e.json(o);
    } catch (s) {
        console.error(s);
    }
});

app.put("/", async function(s, e) {
    console.log("=====================================================================");
    settings = s.body;
    var s = await services.putSettings(settings);
    e.json(s);
});

app.put("/build", async function(s, e, o) {
    console.log("=====================================================================");
    let t;
    try {
        t = await services.putBuild(s.body);
    } catch (s) {
        console.error("putBuild error");
        t = "";
    }
    e.send(s.body);
});

app.use((s, e, o) => {
    const t = new Error("Not found");
    t.status = 404;
    o(t);
});

app.use((s, e, o, t) => {
    console.log(s);
    o.status(s.status || 500).send({
        error: {
            status: s.status || 500,
            message: s.message || "Internal Server Error"
        }
    });
    process.exit(1);
});

app.listen(port, () => {
    console.log("=====================================================================");
    console.log("Backup app listening on port ", port);
});