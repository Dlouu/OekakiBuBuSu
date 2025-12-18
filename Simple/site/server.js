const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8080;

// Dossier pour les dessins
const uploadDir = path.join(__dirname, 'drawings');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Config multer pour recevoir les images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `drawing-${Date.now()}.png`)
});
const upload = multer({ storage });

// Fichiers statiques
app.use(express.static(__dirname));

// Endpoint pour sauvegarder l’image
app.post('/upload', upload.single('drawing'), (req, res) => {
  res.json({ success: true, filename: req.file.filename });
});

// Endpoint pour lister les dessins
app.get('/drawings', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).json([]);
    res.json(files.filter(f => f.endsWith('.png')));
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));