const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const config = require("../../config");

const UPLOADS = config.uploadsRoot;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function orderStorage() {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const orderId = req.params.orderId;
      const dest = path.join(UPLOADS, "orders", String(orderId));
      ensureDir(dest);
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "") || "";
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  });
}

function serviceStorage() {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const serviceId = req.params.serviceId;
      const dest = path.join(UPLOADS, "services", String(serviceId));
      ensureDir(dest);
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "") || "";
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  });
}

const limits = { fileSize: 15 * 1024 * 1024 };

const uploadOrderFiles = multer({
  storage: orderStorage(),
  limits,
}).array("files", 20);

const uploadOrderFilesMw = multer({
  storage: orderStorage(),
  limits,
}).array("files", 20);

const uploadServiceFilesMw = multer({
  storage: serviceStorage(),
  limits,
}).array("files", 20);

function wrapMulter(mw) {
  return (req, res, next) => {
    mw(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ message: err.message });
        }
        return next(err);
      }
      next();
    });
  };
}

module.exports = {
  uploadOrderFiles: wrapMulter(uploadOrderFilesMw),
  uploadServiceFiles: wrapMulter(uploadServiceFilesMw),
  ensureUploadsRootExists() {
    ensureDir(UPLOADS);
  },
};
