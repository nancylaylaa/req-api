const express = require('express')
const app = express()
const port = 9001;
const multer = require('multer')

const { Storage } = require('@google-cloud/storage');
const storage = new Storage({
    projectId: 'trial-bucket-387713', // Replace with your GCP project ID
    keyFilename: './freshcan-storage.json' // Replace with the path to your service account key file
});
const bucketName = 'freshcan-bucket'; // Replace with the name of your Google Cloud Storage bucket
const bucket = storage.bucket(bucketName);

const upload = multer({ storage: multer.memoryStorage() });
app.post('/upload', upload.single('image'), (req, res, next) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
  
    const blob = bucket.file(file.originalname);
    const blobStream = blob.createWriteStream();
  
    blobStream.on('error', (err) => {
      console.error(err);
      next(err);
    });
  
    blobStream.on('finish', () => {
      res.status(200).json({ message: 'File uploaded successfully' });
    });
  
    blobStream.end(file.buffer);
});  

app.listen(port, () => {
  console.log(`app now listening for requests at port ${port}`)
})