const mongoose = require('mongoose');

async function connect() {
    try {
        await mongoose.connect(process.env.DATABASE_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to database!');
    } catch(err) {
        console.log('Connection failed! ', err);
    }
}

module.exports = { connect };