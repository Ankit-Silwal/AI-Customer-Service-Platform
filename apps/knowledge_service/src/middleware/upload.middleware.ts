import multer from "multer";

const storage = multer.memoryStorage();

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
]);

const ALLOWED_EXT = new Set([".pdf", ".docx", ".txt", ".md"]);

function extOf(name: string): string {
  const i = name.toLowerCase().lastIndexOf(".");
  return i >= 0 ? name.toLowerCase().slice(i) : "";
}

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: PDF, DOCX, TXT, MD`));
      return;
    }
    if (!ALLOWED_EXT.has(extOf(file.originalname))) {
      cb(new Error(`Unsupported file extension: ${file.originalname}. Allowed: .pdf, .docx, .txt, .md`));
      return;
    }
    cb(null, true);
  },
});
