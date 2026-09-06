import serverApp from '../jwt-auth/server/app.js';

const { app, connectDB } = serverApp;

export default async function handler(req, res) {
    await connectDB();
    return app(req, res);
}