const faast = require('faast')
const services = require('faast/lib/middleware/services')
const json = require('faast/lib/middleware/json')

const app = faast()

app.use(services('./endpoints/**/*.js'))
app.use(json.write())

const PORT = 3000
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`)
})
