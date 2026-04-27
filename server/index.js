import cors from "cors";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, "data");
const UPLOAD_DIR = path.join(__dirname, "uploads");
const DB_PATH = path.join(DATA_DIR, "db.json");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: async (_req, _file, callback) => {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    callback(null, UPLOAD_DIR);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname);
    const safeBase = path
      .basename(file.originalname, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    callback(null, `${Date.now()}-${safeBase || "image"}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 8,
  },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Only image uploads are allowed."));
      return;
    }

    callback(null, true);
  },
});

const ensureDatabase = async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify({ news: [], upcomingEvents: [] }, null, 2));
  }
};

const readDatabase = async () => {
  await ensureDatabase();
  const raw = await fs.readFile(DB_PATH, "utf8");
  const data = JSON.parse(raw);

  return {
    news: Array.isArray(data.news) ? data.news : [],
    upcomingEvents: Array.isArray(data.upcomingEvents) ? data.upcomingEvents : [],
  };
};

const writeDatabase = async (data) => {
  await ensureDatabase();
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
};

const getBaseUrl = (req) => `${req.protocol}://${req.get("host")}`;

const toImageUrl = (req, file) => `${getBaseUrl(req)}/uploads/${file.filename}`;

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const matchesId = (item, id) => item._id === id || item.id === id;

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/news", async (_req, res, next) => {
  try {
    const db = await readDatabase();
    res.json(db.news);
  } catch (error) {
    next(error);
  }
});

app.post("/api/news", upload.single("image"), async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || req.body.desc || "").trim();

    if (!title || !description || !req.file) {
      res.status(400).json({ message: "Title, description, and image are required." });
      return;
    }

    const db = await readDatabase();
    const newsItem = {
      _id: makeId(),
      title,
      description,
      image: toImageUrl(req, req.file),
      createdAt: new Date().toISOString(),
    };

    db.news.unshift(newsItem);
    await writeDatabase(db);
    res.status(201).json(newsItem);
  } catch (error) {
    next(error);
  }
});

app.get("/api/news/:id", async (req, res, next) => {
  try {
    const db = await readDatabase();
    const newsItem = db.news.find((item) => matchesId(item, req.params.id));

    if (!newsItem) {
      res.status(404).json({ message: "News item not found." });
      return;
    }

    res.json(newsItem);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/news/:id", async (req, res, next) => {
  try {
    const db = await readDatabase();
    const nextItems = db.news.filter((item) => !matchesId(item, req.params.id));

    if (nextItems.length === db.news.length) {
      res.status(404).json({ message: "News item not found." });
      return;
    }

    db.news = nextItems;
    await writeDatabase(db);
    res.json({ message: "News deleted successfully." });
  } catch (error) {
    next(error);
  }
});

app.get(["/api/upcoming-events", "/api/events"], async (_req, res, next) => {
  try {
    const db = await readDatabase();
    res.json(db.upcomingEvents);
  } catch (error) {
    next(error);
  }
});

app.post(["/api/upcoming-events", "/api/events"], upload.array("images", 8), async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || req.body.desc || "").trim();
    const files = Array.isArray(req.files) ? req.files : [];

    if (!title || !description || files.length === 0) {
      res.status(400).json({ message: "Title, description, and at least one image are required." });
      return;
    }

    const db = await readDatabase();
    const eventItem = {
      _id: makeId(),
      title,
      description,
      images: files.map((file) => toImageUrl(req, file)),
      isActive: req.body.isActive === "true" || req.body.isActive === "on",
      createdAt: new Date().toISOString(),
    };

    db.upcomingEvents.unshift(eventItem);
    await writeDatabase(db);
    res.status(201).json(eventItem);
  } catch (error) {
    next(error);
  }
});

app.get(["/api/upcoming-events/:id", "/api/events/:id"], async (req, res, next) => {
  try {
    const db = await readDatabase();
    const eventItem = db.upcomingEvents.find((item) => matchesId(item, req.params.id));

    if (!eventItem) {
      res.status(404).json({ message: "Upcoming event not found." });
      return;
    }

    res.json(eventItem);
  } catch (error) {
    next(error);
  }
});

app.delete(["/api/upcoming-events/:id", "/api/events/:id"], async (req, res, next) => {
  try {
    const db = await readDatabase();
    const nextItems = db.upcomingEvents.filter((item) => !matchesId(item, req.params.id));

    if (nextItems.length === db.upcomingEvents.length) {
      res.status(404).json({ message: "Upcoming event not found." });
      return;
    }

    db.upcomingEvents = nextItems;
    await writeDatabase(db);
    res.json({ message: "Upcoming event deleted successfully." });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  res.status(500).json({ message: error.message || "Server error." });
});

app.listen(PORT, () => {
  console.log(`RealityLife backend running on http://localhost:${PORT}`);
});
