const { app, connectDB } = require('./app.js');
const PORT = process.env.PORT || 5000;

const start = async() => {
    try {
        await connectDB();
        app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
    } catch (e) {
        console.log('Ошибка при подключении к БД:', e);
    }
};

start();