const express = require('express')
require('./db/mongoose.js')
const routerTask = require('./routers/task.js')
const routerUser = require('./routers/user.js')

const app = express()
const port = process.env.PORT

app.use(express.json())
app.use(routerTask)
app.use(routerUser)

app.listen(port, ()=>{
    console.log('Server running on port ' + port)
})