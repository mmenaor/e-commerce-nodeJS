const { app } = require('./app');

const { initModels } = require('./models/initModels');

// import database
const { db } = require('./utils/database.util');

db.authenticate()
    .then(() => console.log('Database authenticated'))
    .catch(err => console.log(err));

//Establish model's relations
initModels();

//Sync database
db.sync()
    .then(() => console.log('Database sync'))
    .catch(err => console.log(err));

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Express app running in PORT ${PORT}!!!`);
});