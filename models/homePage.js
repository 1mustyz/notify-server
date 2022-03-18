const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HomePageSchema = Schema({
    mainEvents: [{type: Object}],
    newsEvents: [{type: Object}],
    programs: [{type: Object}],
    vc: {type: Object},
}, { timestamps: true });

const HomePage = mongoose.model('homePage', HomePageSchema)
module.exports = HomePage;