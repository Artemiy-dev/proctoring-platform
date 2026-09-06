module.exports = class UserDto {
  id;
  email;
  name;
  role;
  isActivated;

  constructor(model) {
    this.id = model._id;
    this.email = model.email;
    // Берем имя из БД, если его нет — ищем fullName, и только в крайнем случае обрезаем email
    this.name = model.name || model.fullName || model.email.split('@')[0];
    this.role = (model.role || 'USER').toUpperCase();
    this.isActivated = model.isActivated;
  }
};