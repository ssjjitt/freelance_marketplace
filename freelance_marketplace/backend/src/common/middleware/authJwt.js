const jwt = require("jsonwebtoken");
const db = require("../../models");
const User = db.user;
const Role = db.role;

function normalizeRoleNames(roleList) {
  if (!Array.isArray(roleList)) return [];
  return roleList.map((x) => (typeof x === "string" ? x : x.name));
}

function verifyRole(roles) {
  return (req, res, next) => {
    const userRoles = normalizeRoleNames(req.user.roles);
    if (roles.some((r) => userRoles.includes(r))) {
      next();
    } else {
      res.status(403).send({ message: "Нет доступа" });
    }
  };
}

function verifyToken(req, res, next) {
  let token = req.session.token;

  if (!token) {
    return res.status(403).send({
      message: "Нет токена!",
    });
  }

  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Неавторизовано!",
      });
    }
    req.userId = decoded.id;
    next();
  });
}

function extractBearerToken(req) {
  let token = req.session.token;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }
  return token;
}

async function getUserFromToken(req, res, next) {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      return res.status(403).send({
        message: "Нет токена!",
      });
    }

    const decoded = jwt.verify(token, process.env.SECRET);
    const user = await User.findByPk(decoded.id, {
      include: [
        {
          model: Role,
          as: "roles",
          through: { attributes: [] },
        },
      ],
    });

    if (!user) {
      return res.status(404).send({
        message: "Пользователь не найден!",
      });
    }

    if (user.isBlocked) {
      return res.status(403).send({
        message: "Ваш аккаунт заблокирован!",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).send({
      message: "Неавторизовано!",
    });
  }
}

function mapRoleNames(user) {
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.map((r) => r.name || r);
  }
  return [];
}

async function isAdministrator(req, res, next) {
  try {
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).send({
        message: "Пользователь не найден!",
      });
    }

    const userRoles = mapRoleNames(currentUser);
    if (userRoles.includes("administrator")) {
      return next();
    }

    const roles = await currentUser.getRoles();
    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "administrator") {
        return next();
      }
    }

    return res.status(403).send({
      message: "Требуется роль администратора!",
    });
  } catch (error) {
    return res.status(500).send({
      message: "Роль не прошла валидацию!",
    });
  }
}

async function userHasRole(userId, roleName) {
  const user = await User.findByPk(userId);
  if (!user) return false;
  const roles = await user.getRoles();
  return roles.some((r) => r.name === roleName);
}

async function isCustomer(req, res, next) {
  try {
    const ok = await userHasRole(req.userId, "customer");
    if (ok) return next();
    return res.status(403).send({
      message: "Роль заказчика обязательна!",
    });
  } catch (error) {
    return res.status(500).send({
      message: "Роль не прошла валидацию!",
    });
  }
}

async function isExecuter(req, res, next) {
  try {
    const ok = await userHasRole(req.userId, "executer");
    if (ok) return next();
    return res.status(403).send({
      message: "Роль исполнителя обязательна!",
    });
  } catch (error) {
    return res.status(500).send({
      message: "Роль не прошла валидацию!",
    });
  }
}

const authJwt = {
  verifyToken,
  getUserFromToken,
  verifyRole,
  isAdministrator,
  isCustomer,
  isExecuter,
};

module.exports = authJwt;
