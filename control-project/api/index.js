const { app, connectDB } = require('../jwt-auth/server/app.js');

module.exports = async(req, res) => {
    await connectDB();
    return app(req, res);
};