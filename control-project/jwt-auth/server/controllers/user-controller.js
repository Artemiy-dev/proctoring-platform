const userService = require("../service/user-service");
const ApiError = require("../exceptions/api-error");
const { validationResult } = require('express-validator');

// Единые опции для кук, чтобы не дублировать код
const COOKIE_OPTIONS = {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production'
};

class UserController {
    async registration(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(ApiError.BadRequest('Ошибка при валидации', errors.array()));
            }

            const { email, password, name } = req.body;
            const userData = await userService.registration(email, password, name);

            res.cookie('refreshToken', userData.refreshToken, COOKIE_OPTIONS);

            return res.json(userData);
        } catch (e) {
            next(e);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const userData = await userService.login(email, password);

            res.cookie('refreshToken', userData.refreshToken, COOKIE_OPTIONS);

            return res.json(userData);
        } catch (e) {
            next(e);
        }
    }

    async logout(req, res, next) {
        try {
            const { refreshToken } = req.cookies;
            const token = await userService.logout(refreshToken);
            res.clearCookie('refreshToken', COOKIE_OPTIONS);
            return res.json(token);
        } catch (e) {
            next(e);
        }
    }

    async activate(req, res, next) {
        try {
            const activationLink = req.params.link;
            await userService.activate(activationLink);
            return res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
        } catch (e) {
            next(e);
        }
    }

    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.cookies;

            // Если куки с рефреш токеном нет — сразу возвращаем ошибку авторизации
            if (!refreshToken) {
                throw ApiError.UnauthorizedError();
            }

            const userData = await userService.refresh(refreshToken);

            res.cookie('refreshToken', userData.refreshToken, COOKIE_OPTIONS);
            return res.json(userData);
        } catch (e) {
            // Очищаем битую/невалидную куку при ошибке
            res.clearCookie('refreshToken', COOKIE_OPTIONS);
            next(e);
        }
    }

    async getUsers(req, res, next) {
        try {
            const users = await userService.getAllUsers();
            return res.json(users);
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new UserController();