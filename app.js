const express = require('express')

const app = express()

const cors = require('cors')

const services = require('./services')

const port = 21311

let settings = ''

app.use(
	express.urlencoded({
		extended: true,
	})
)
app.use(express.json())

app.use(cors())

app.get('/', function(req, res) {
	// @ A get request is submitted from the frontened GUI at the start to get the settings
	// @ We send back settings.json to it since the frontend can't read files on the computer, but Node can

	console.log('=====================================================================')

	services.getSettings()
		.then((i) => {
			// @ settings file read successfully, return the data
			res.send(i)
		})
		.catch((err) => {
			console.error(`ERROR:  ${err}`)
			if (err === 'Settings file not found') {
				console.log('Settings not found')
				services.newSettings().then((v) => {
					res.send(v)
				})
			} else {
				let sr = services.settingsBackup()
					.then((r) => {
						services.newSettings().then((v) => {
								res.send(v)
							})
							.catch((err) => {
								console.log(err)
								res.send({
									'Backup List': [],
									'Script message': err,
									'Important Error Message': err
								})
							})
					})
					.catch((err) => {
						console.log(err)
						res.send({
							'Backup List': [],
							'Script message': err,
							'Important Error Message': err
						})
					})
				// @ Scripts directory doesn't exist and couldn't be created.
				// @ Couldn't read settings file.
			}
		})
})

app.put('/', async function(req, res) {
	// @ Put requests update json from the frontend and writes to the settings.json file
	// @ It gets the json data from the body of the request
	console.log('=====================================================================')

	settings = req.body

	services
		.putSettings(settings)
		.then((j) => {
			res.json(j)
		})
		.catch((err) => {
			console.log(err)
			res.send('')
		})
})


app.put('/build', async function(req, res) {
	// @ build === true tells express to build a new script
	// @ build === false just saves the changes to settings.json, putSettings() in Node.js
	console.log('=====================================================================')
	let json

	await services
		.putBuild(req.body)
		.then((j) => {
			res.send(j)
		})
		.catch((err) => {
			res.send('')
		})
})

app.use((req, res, next) => {
	const error = new Error('Not found')
	error.status = 404
	next(error)
})

// @ error handler middleware
app.use((error, req, res, next) => {
	console.log(error)
	res.status(error.status || 500).send({
		error: {
			status: error.status || 500,
			message: error.message || 'Internal Server Error',
		},
	})
	process.exit(1)
})

app.listen(port, () => {
	console.log('=====================================================================')
	console.log('Backup app listening on port ', port)
})
