const resumeService = require("./resume.service");
const { asyncHandler } = require("../../common/middleware");

exports.createResume = asyncHandler(async (req, res) => {
  const resume = await resumeService.createResume(req.user.id, req.body);
  res.status(201).send(resume);
});

exports.getResumes = asyncHandler(async (req, res) => {
  const resumes = await resumeService.listResumes(req.query);
  res.status(200).send(resumes);
});

exports.getResumeById = asyncHandler(async (req, res) => {
  const resume = await resumeService.getResumeById(req.params.id);
  res.status(200).send(resume);
});

exports.updateResume = asyncHandler(async (req, res) => {
  const resume = await resumeService.updateResume(req.user.id, req.params.id, req.body);
  res.status(200).send(resume);
});

exports.deleteResume = asyncHandler(async (req, res) => {
  await resumeService.deleteResume(req.user.id, req.params.id);
  res.status(200).send({ message: "Резюме удалено" });
});

exports.approveResume = asyncHandler(async (req, res) => {
  const resume = await resumeService.approveResume(req.user.id, req.params.id);
  res.status(200).send(resume);
});

exports.getPendingResumes = asyncHandler(async (req, res) => {
  const resumes = await resumeService.listPendingResumes(req.user.id);
  res.status(200).send(resumes);
});
