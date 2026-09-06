const { app, connectDB } = require('../app.js');

module.exports = async(req, res) => {
    await connectDB();
    return app(req, res);
};