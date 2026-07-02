const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const argon2 = require("argon2");
const db = require("../../models");
const User = db.user;
const Role = db.role;
const config = require("../../config");
const { createMailTransporter } = require("../../common/mail/mail.transporter");

/**
 * Регистрация пользователя в БД и назначение ролей.
 * @param {{ username: string, email: string, password: string, roles?: string[] }} body
 * @returns {Promise<{ message: string }>}
 */
const signup = async ({ username, email, password, roles: roleNames }) => {
  try {
    if (!username?.trim() || !email?.trim() || !password) {
      const err = new Error("Укажите имя пользователя, email и пароль");
      err.statusCode = 400;
      throw err;
    }

    const user = await User.create({
      username: username.trim(),
      email: email.trim(),
      password: await argon2.hash(password),
    });

    if (roleNames && roleNames.length > 0) {
      const roles = await Role.findAll({
        where: { name: roleNames },
      });
      await user.setRoles(roles);
    } else {
      await user.setRoles([1]);
    }

    return { message: "Успешная регистрация пользователя!" };
  } catch (error) {
    if (error.statusCode) throw error;
    throw error;
  }
};

const buildAuthorities = (roles) => {
  const authorities = [];
  for (let i = 0; i < roles.length; i++) {
    authorities.push("ROLE_" + roles[i].name.toUpperCase());
  }
  return authorities;
};

/**
 * Аутентификация: проверка пароля и выдача JWT.
 * @param {{ username: string, password: string }} credentials
 * @param session — cookie-session объект
 * @returns {Promise<object>} пользователь и accessToken
 */
const signin = async ({ username, password }, session) => {
  try {
    if (!username?.trim() || !password) {
      const err = new Error("Укажите логин и пароль");
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findOne({
      where: { username: username.trim() },
    });

    if (!user) {
      const err = new Error("Пользователь не найден.");
      err.statusCode = 404;
      throw err;
    }

    const passwordIsValid = await argon2.verify(user.password, password);

    if (!passwordIsValid) {
      const err = new Error("Пароль неверный!");
      err.statusCode = 401;
      throw err;
    }

    const secret = process.env.SECRET;
    if (!secret) {
      const err = new Error("Серверная конфигурация: отсутствует SECRET");
      err.statusCode = 500;
      throw err;
    }

    const token = jwt.sign({ id: user.id }, secret, {
      algorithm: "HS256",
      allowInsecureKeySizes: true,
      expiresIn: 86400,
    });

    const roles = await user.getRoles();
    const authorities = buildAuthorities(roles);
    const primaryRole = roles.length > 0 ? roles[0].name : "customer";

    if (session) {
      session.token = token;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: primaryRole,
      roles: authorities,
      accessToken: token,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw error;
  }
};

/**
 * Завершение сессии (очистка cookie-session).
 * @param {import('express').Request} req
 */
const signout = (req) => {
  if (req?.session !== undefined) {
    req.session = null;
  }
  return { message: "Вы вышли из аккаунта!" };
};

/** Нормализованный email → { code, expiresAt } */
const verificationCodes = new Map();

const VERIFICATION_TTL_MS = 15 * 60 * 1000;

const normalizeEmail = (e) => String(e || "").trim().toLowerCase();

function pruneExpiredVerificationCodes() {
  const now = Date.now();
  for (const [key, entry] of verificationCodes.entries()) {
    if (!entry || entry.expiresAt < now) {
      verificationCodes.delete(key);
    }
  }
}

/**
 * Отправка письма с 4-значным кодом подтверждения email.
 * @param {string} email
 */
const sendVerificationEmail = async (email) => {
  try {
    if (!email?.trim()) {
      const err = new Error("Укажите email");
      err.statusCode = 400;
      throw err;
    }

    const normalized = normalizeEmail(email);
    pruneExpiredVerificationCodes();

    const code = String(crypto.randomInt(0, 10000)).padStart(4, "0");
    verificationCodes.set(normalized, {
      code,
      expiresAt: Date.now() + VERIFICATION_TTL_MS,
    });

    const transporter = createMailTransporter();

    await transporter.sendMail({
      from: `"Freelance Marketplace" <${config.email.user}>`,
      to: normalized,
      subject: "Код подтверждения email",
      text: `Ваш код подтверждения: ${code}\n\nКод действует 15 минут. Если вы не запрашивали письмо, проигнорируйте его.`,
      html: `<p>Ваш код подтверждения:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${code}</p><p>Код действует 15 минут.</p><p>Если вы не запрашивали письмо, проигнорируйте его.</p>`,
    });

    return { message: "Письмо с кодом отправлено" };
  } catch (error) {
    if (error.statusCode) throw error;
    throw error;
  }
};

/**
 * Проверка кода из письма (до регистрации пользователь в БД может отсутствовать).
 * @param {string} email
 * @param {string} rawCode
 */
const verifyEmailCode = async (email, rawCode) => {
  if (!email?.trim()) {
    const err = new Error("Укажите email");
    err.statusCode = 400;
    throw err;
  }

  const digits = String(rawCode ?? "").replace(/\D/g, "").slice(0, 4);
  if (digits.length !== 4) {
    const err = new Error("Введите 4 цифры кода из письма");
    err.statusCode = 400;
    throw err;
  }

  const normalized = normalizeEmail(email);
  pruneExpiredVerificationCodes();

  const entry = verificationCodes.get(normalized);
  if (!entry || entry.expiresAt < Date.now()) {
    const err = new Error("Код недействителен или истёк. Запросите новый код.");
    err.statusCode = 400;
    throw err;
  }

  if (entry.code !== digits) {
    const err = new Error("Неверный код");
    err.statusCode = 400;
    throw err;
  }

  verificationCodes.delete(normalized);
  return { verified: true, message: "Email подтверждён" };
};

const frontendBaseUrl = () => config.corsOrigins[0] || "http://localhost:3000";

module.exports = {
  signup,
  signin,
  signout,
  sendVerificationEmail,
  verifyEmailCode,
  frontendBaseUrl,
};
