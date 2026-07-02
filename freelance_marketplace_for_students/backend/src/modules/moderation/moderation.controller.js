const {
  listPendingResumes,
  approveResume,
  rejectResume,
  listPendingServices,
  approveService,
  rejectService,
  deleteServiceByManager,
  getModerationStats,
} = require("./moderation.service");

// ===== RESUME MODERATION =====

exports.getPendingResumes = async (req, res) => {
  try {
    const resumes = await listPendingResumes(req.user.id);
    res.json(resumes);
  } catch (error) {
    if (error.statusCode === 403) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.approveResumeHandler = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const resume = await approveResume(req.user.id, resumeId);
    res.json({ message: "Резюме одобрено", resume });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    if (error.statusCode === 403) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.rejectResumeHandler = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const { reason } = req.body;
    const resume = await rejectResume(req.user.id, resumeId, reason);
    res.json({ message: "Резюме отклонено", resume });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    if (error.statusCode === 403) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

// ===== SERVICE MODERATION =====

exports.getPendingServices = async (req, res) => {
  try {
    const services = await listPendingServices(req.user.id);
    res.json(services);
  } catch (error) {
    if (error.statusCode === 403) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.approveServiceHandler = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const service = await approveService(req.user.id, serviceId);
    res.json({ message: "Сервис одобрен", service });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    if (error.statusCode === 403) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.rejectServiceHandler = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { reason } = req.body;
    const service = await rejectService(req.user.id, serviceId, reason);
    res.json({ message: "Сервис отклонен", service });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    if (error.statusCode === 403) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteServiceHandler = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const service = await deleteServiceByManager(req.user.id, serviceId);
    res.json({ message: "Сервис удален", service });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    if (error.statusCode === 403) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

// ===== STATS =====

exports.getModerationStatsHandler = async (req, res) => {
  try {
    const stats = await getModerationStats(req.user.id);
    res.json(stats);
  } catch (error) {
    if (error.statusCode === 403) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};
