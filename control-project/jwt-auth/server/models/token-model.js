const { Schema, model } = require('mongoose');

// 1. Объявляем схему для токенов
const TokenSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    refreshToken: { type: String, required: true }
});

// 2. Регистрируем и экспортируем модель
module.exports = model('Token', TokenSchema);