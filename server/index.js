import cors from "cors";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
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
    await fs.writeFile(DB_PATH, JSON.stringify({ posts: [], news: [], upcomingEvents: [] }, null, 2));
  }
};

const readDatabase = async () => {
  await ensureDatabase();
  const raw = await fs.readFile(DB_PATH, "utf8");
  const data = JSON.parse(raw);

  return {
    posts: Array.isArray(data.posts) ? data.posts : [],
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

const getSubmittedImage = (req) => {
  if (req.file) {
    return toImageUrl(req, req.file);
  }

  return String(req.body.imageUrl || req.body.image || "").trim();
};

const makeId = () => randomUUID();

const matchesId = (item, id) => item._id === id || item.id === id;

const createRecord = (record) => {
  const id = makeId();

  return {
    id,
    _id: id,
    ...record,
    createdAt: new Date().toISOString(),
  };
};

const findById = (items, id) => items.find((item) => matchesId(item, id));

const notFound = (res, message) => {
  res.status(404).json({ message });
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/posts", async (_req, res, next) => {
  try {
    const db = await readDatabase();
    res.json(db.posts);
  } catch (error) {
    next(error);
  }
});

app.post(
  "/api/posts",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 8 },
  ]),
  async (req, res, next) => {
    try {
      const title = String(req.body.title || "").trim();
      const desc = String(req.body.desc || req.body.description || "").trim();
      const type = String(req.body.type || "Magazine").trim();
      const fileGroups = req.files && typeof req.files === "object" ? req.files : {};
      const files = [...(fileGroups.image || []), ...(fileGroups.images || [])];
      const images = files.map((file) => toImageUrl(req, file));

      if (!title || !desc || images.length === 0) {
        res.status(400).json({ message: "Title, description, and at least one image are required." });
        return;
      }

      const db = await readDatabase();
      const postItem = createRecord({
        title,
        type,
        desc,
        description: desc,
        image: images[0],
        images,
      });

      db.posts.unshift(postItem);
      await writeDatabase(db);
      res.status(201).json(postItem);
    } catch (error) {
      next(error);
    }
  }
);

app.get("/api/posts/:id", async (req, res, next) => {
  try {
    const db = await readDatabase();
    const postItem = findById(db.posts, req.params.id);

    if (!postItem) {
      notFound(res, "Blog item not found.");
      return;
    }

    res.json(postItem);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/posts/:id", async (req, res, next) => {
  try {
    const db = await readDatabase();
    const nextItems = db.posts.filter((item) => !matchesId(item, req.params.id));

    if (nextItems.length === db.posts.length) {
      notFound(res, "Blog item not found.");
      return;
    }

    db.posts = nextItems;
    await writeDatabase(db);
    res.json({ message: "Blog deleted successfully." });
  } catch (error) {
    next(error);
  }
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
    const image = getSubmittedImage(req);

    if (!title || !description || !image) {
      res.status(400).json({
        message: "Title, description, and image are required. Upload a file named 'image' or provide an imageUrl.",
      });
      return;
    }

    const db = await readDatabase();
    const newsItem = createRecord({
      title,
      description,
      image,
    });

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
    const newsItem = findById(db.news, req.params.id);

    if (!newsItem) {
      notFound(res, "News item not found.");
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
      notFound(res, "News item not found.");
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
    const eventItem = createRecord({
      title,
      description,
      images: files.map((file) => toImageUrl(req, file)),
      isActive: req.body.isActive === "true" || req.body.isActive === "on",
    });

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
    const eventItem = findById(db.upcomingEvents, req.params.id);

    if (!eventItem) {
      notFound(res, "Upcoming event not found.");
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
      notFound(res, "Upcoming event not found.");
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
