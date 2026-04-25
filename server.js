console.log("MONGO_URL =", process.env.MONGO_URL);
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

dotenv.config();

const app = express();

// SECURITY
app.use(cors());
app.use(express.json());
app.use(helmet());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// CLOUDINARY CONFIG
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// STORAGE IMAGES
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "comah_biens",
    allowed_formats: ["jpg", "png", "jpeg"]
  }
});

const upload = multer({ storage });

// DATABASE
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("MongoDB connecté"))
.catch(err => console.log(err));

// SCHEMA
const BienSchema = new mongoose.Schema({
  type: { type: String, required: true },
  photos: { type: [String], required: true },
  prix: { type: String, required: true },
  arrondissement: { type: String, required: true },
  description: { type: String, required: true },
  contact: { type: String, required: true },
  adresse: { type: String, required: true },
  categorie: { type: String, required: true }
});

const Bien = mongoose.model("Bien", BienSchema);

// VALIDATION SIMPLE
function validate(data) {
  return data.type && data.prix && data.arrondissement && data.contact;
}

// CREATE BIEN
app.post("/biens", upload.array("photos", 15), async (req, res) => {
  try {
    if (!validate(req.body)) {
      return res.status(400).json({ message: "Données invalides" });
    }

    const images = req.files.map(file => file.path);

    const bien = new Bien({
      ...req.body,
      photos: images
    });

    await bien.save();
    res.json(bien);

  } catch (err) {
    res.status(500).json(err);
  }
});

// GET BIENS
app.get("/biens", async (req, res) => {
  const data = await Bien.find();
  res.json(data);
});

app.listen(process.env.PORT, () => {
  console.log("COMAH API running");
});
        
