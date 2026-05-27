const db = require("../../models");
const Resume = db.resume;
const Service = db.service;
const User = db.user;
const { createNotification } = require("../notification/notification.service");

async function assertManager(userId) {
  const user = await User.findByPk(userId, {
    include: [{ model: db.role, as: "roles", through: { attributes: [] } }],
  });
  if (!user) {
    const err = new Error("Пользователь не найден");
    err.statusCode = 404;
    throw err;
  }
  const userRoles = user.roles.map((r) => r.name);
  if (!userRoles.includes("manager") && !userRoles.includes("administrator")) {
    const err = new Error("Только менеджеры могут модерировать контент");
    err.statusCode = 403;
    throw err;
  }
}

// ===== RESUME MODERATION =====

async function listPendingResumes(managerId) {
  try {
    await assertManager(managerId);

    return await Resume.findAll({
      where: { isApproved: false },
      include: [{ model: User, as: "executer", attributes: ["id", "username", "email"] }],
      order: [["createdAt", "ASC"]],
    });
  } catch (error) {
    throw error;
  }
}

async function approveResume(managerId, resumeId) {
  try {
    await assertManager(managerId);

    const resume = await Resume.findByPk(resumeId);
    if (!resume) {
      const err = new Error("Резюме не найдено");
      err.statusCode = 404;
      throw err;
    }

    await resume.update({ isApproved: true });

    await createNotification(
      resume.executerId,
      "resume_approved",
      "Резюме одобрено",
      `Ваше резюме "${resume.title}" было одобрено модератором и теперь видно в каталоге`,
      resume.id,
      "resume"
    );

    return await Resume.findByPk(resumeId, {
      include: [{ model: User, as: "executer", attributes: ["id", "username", "email"] }],
    });
  } catch (error) {
    throw error;
  }
}

async function rejectResume(managerId, resumeId, reason) {
  try {
    await assertManager(managerId);

    const resume = await Resume.findByPk(resumeId);
    if (!resume) {
      const err = new Error("Резюме не найдено");
      err.statusCode = 404;
      throw err;
    }

    // Деактивируем резюме вместо удаления, чтобы пользователь знал о причине отклонения
    await resume.update({ isActive: false });

    const rejectionMessage = reason
      ? `Ваше резюме "${resume.title}" было отклонено. Причина: ${reason}`
      : `Ваше резюме "${resume.title}" было отклонено модератором`;

    await createNotification(
      resume.executerId,
      "resume_rejected",
      "Резюме отклонено",
      rejectionMessage,
      resume.id,
      "resume"
    );

    return await Resume.findByPk(resumeId, {
      include: [{ model: User, as: "executer", attributes: ["id", "username", "email"] }],
    });
  } catch (error) {
    throw error;
  }
}

// ===== SERVICE MODERATION =====

async function listPendingServices(managerId) {
  try {
    await assertManager(managerId);

    return await Service.findAll({
      where: { isApproved: false },
      include: [{ model: User, as: "executer", attributes: ["id", "username", "email"] }],
      order: [["createdAt", "ASC"]],
    });
  } catch (error) {
    throw error;
  }
}

async function approveService(managerId, serviceId) {
  try {
    await assertManager(managerId);

    const service = await Service.findByPk(serviceId);
    if (!service) {
      const err = new Error("Сервис не найден");
      err.statusCode = 404;
      throw err;
    }

    await service.update({ isApproved: true });

    await createNotification(
      service.executerId,
      "service_approved",
      "Сервис одобрен",
      `Ваш сервис "${service.title}" был одобрен менеджером и теперь доступен покупателям`,
      service.id,
      "service"
    );

    return await Service.findByPk(serviceId, {
      include: [{ model: User, as: "executer", attributes: ["id", "username", "email"] }],
    });
  } catch (error) {
    throw error;
  }
}

async function rejectService(managerId, serviceId, reason) {
  try {
    await assertManager(managerId);

    const service = await Service.findByPk(serviceId);
    if (!service) {
      const err = new Error("Сервис не найден");
      err.statusCode = 404;
      throw err;
    }

    await service.update({ isActive: false });

    const rejectionMessage = reason
      ? `Ваш сервис "${service.title}" был отклонен. Причина: ${reason}`
      : `Ваш сервис "${service.title}" был отклонён менеджером`;

    await createNotification(
      service.executerId,
      "service_rejected",
      "Сервис отклонен",
      rejectionMessage,
      service.id,
      "service"
    );

    return await Service.findByPk(serviceId, {
      include: [{ model: User, as: "executer", attributes: ["id", "username", "email"] }],
    });
  } catch (error) {
    throw error;
  }
}

async function deleteServiceByManager(managerId, serviceId) {
  try {
    await assertManager(managerId);

    const service = await Service.findByPk(serviceId);
    if (!service) {
      const err = new Error("Сервис не найден");
      err.statusCode = 404;
      throw err;
    }

    const serviceSnapshot = {
      id: service.id,
      title: service.title,
      executerId: service.executerId,
    };

    await service.destroy();

    await createNotification(
      serviceSnapshot.executerId,
      "service_deleted",
      "Сервис удален",
      `Ваш сервис "${serviceSnapshot.title}" был удален менеджером`,
      serviceSnapshot.id,
      "service"
    );

    return serviceSnapshot;
  } catch (error) {
    throw error;
  }
}

// ===== MODERATION STATS =====

async function getModerationStats(managerId) {
  try {
    await assertManager(managerId);

    const pendingResumes = await Resume.count({ where: { isApproved: false } });
    const pendingServices = await Service.count({ where: { isApproved: false } });
    const approvedResumes = await Resume.count({ where: { isApproved: true } });
    const approvedServices = await Service.count({ where: { isApproved: true } });

    return {
      resumes: {
        pending: pendingResumes,
        approved: approvedResumes,
      },
      services: {
        pending: pendingServices,
        approved: approvedServices,
      },
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  assertManager,
  // Resume moderation
  listPendingResumes,
  approveResume,
  rejectResume,
  // Service moderation
  listPendingServices,
  approveService,
  rejectService,
  deleteServiceByManager,
  // Stats
  getModerationStats,
};
