import $api from './api';

export default class UserService {
  static async getUsers() {
    const response = await $api.get('/users');
    return response.data;
  }
}