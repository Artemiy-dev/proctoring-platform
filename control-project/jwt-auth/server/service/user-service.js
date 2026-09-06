const userModel = require('../models/user-model');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const mailService = require('./mail-service');
const tokenService = require('./token-service');
const UserDto = require('../dtos/user-dtos');
const ApiError = require('../exceptions/api-error');

class UserService {
    async registration(email, password, name = '') {
        const candidate = await userModel.findOne({ email });
        if (candidate) {
            throw ApiError.BadRequest(`Пользователь с почтовым адресом ${email} уже существует`);
        }
        const hashPassword = await bcrypt.hash(password, 3);
        const activationLink = uuid.v4();

        const user = await userModel.create({
            email,
            password: hashPassword,
            activationLink,
            name: name || email.split('@')[0],
            role: 'USER'
        });

        await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`);

        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto });
        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return {...tokens, user: userDto };
    }

    async activate(activationLink) {
        const user = await userModel.findOne({ activationLink });
        if (!user) {
            throw ApiError.BadRequest('Некорректная ссылка активации');
        }
        user.isActivated = true;
        await user.save();
    }

    async login(email, password) {
        const user = await userModel.findOne({ email });
        if (!user) {
            throw ApiError.BadRequest('Пользователь с таким email не найден');
        }
        const isPassEquals = await bcrypt.compare(password, user.password);
        if (!isPassEquals) {
            throw ApiError.BadRequest('Неверный пароль');
        }
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto });

        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        return {...tokens, user: userDto };
    }

    async logout(refreshToken) {
        const token = await tokenService.removeToken(refreshToken);
        return token;
    }

    async refresh(refreshToken) {
        if (!refreshToken) {
            console.log('REFRESH DEBUG: токен не пришёл вообще');
            throw ApiError.UnauthorizedError();
        }
        const userData = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDb = await tokenService.findToken(refreshToken);

        console.log('REFRESH DEBUG: userData =', userData ? 'валиден' : 'НЕ валиден (JWT verify failed)');
        console.log('REFRESH DEBUG: tokenFromDb =', tokenFromDb ? 'найден в базе' : 'НЕ найден в базе');
        console.log('REFRESH DEBUG: кука, которую прислали:', refreshToken);
        if (tokenFromDb) {
            console.log('REFRESH DEBUG: токен из базы:', tokenFromDb.refreshToken);
        }

        if (!userData || !tokenFromDb) {
            throw ApiError.UnauthorizedError();
        }
        const user = await userModel.findById(userData.id);
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto });

        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        return {...tokens, user: userDto };
    }

    async getAllUsers() {
        const users = await userModel.find();
        return users;
    }
}

module.exports = new UserService();