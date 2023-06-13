const express = require('express')
const app = express()
const port = 9001;
const Multer = require('multer');
const util = require('util');
const { Storage } = require('@google-cloud/storage');

require('dotenv').config();
const privateKey = process.env.PRIVATE_KEY;

const storage = new Storage({
    projectId: 'freshcan-388215', // Replace with your GCP project ID
    keyFilename: privateKey // Replace with the path to your service account key file
});
const bucketName = 'freshcan-bucket'; // Replace with the name of your Google Cloud Storage bucket
const bucket = storage.bucket(bucketName);

const multer = Multer({
  storage: Multer.memoryStorage(),
}).single('image');

// Promisify the multer middleware
const processFileMiddleware = util.promisify(multer);

// Create a new handler for the upload route
const uploadHandler = async (req, res) => {
  try {
    await processFileMiddleware(req, res);

    if (!req.file) {
      return res.status(400).send({ message: 'Please upload a file!' });
    }

    // Create a new blob in the bucket and upload the file data
    const blob = bucket.file(req.file.originalname);
    const blobStream = blob.createWriteStream();

    blobStream.on('error', (err) => {
      res.status(500).send({ message: err.message });
    });

    blobStream.on('finish', async () => {
      // Create URL for direct file access via HTTP
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

      try {
        // Make the file public
        await bucket.file(req.file.originalname).makePublic();
      } catch (err) {
        return res.status(500).send({
          message: `Uploaded the file successfully: ${req.file.originalname}, but public access is denied!`,
          url: publicUrl,
        });
      }

      res.status(200).send({
        message: 'File uploaded successfully',
        image: req.file.originalname,
        url: publicUrl,
      });
    });

    blobStream.end(req.file.buffer);
  } catch (err) {
    res.status(500).send({
      message: `Could not upload the file: ${req.file.originalname}. ${err}`,
    });
  }
};

// Route for file upload
app.post('/upload', uploadHandler);

app.listen(port, () => {
  console.log(`app now listening for requests at port ${port}`)
})