const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, default: '' }, // 👈 ОБЯЗАТЕЛЬНО ДОБАВЬ ЭТО ПОЛЕ
  isActivated: { type: Boolean, default: false },
  activationLink: { type: String },
  role: { type: String, default: 'USER' },
});

module.exports = model('User', UserSchema);