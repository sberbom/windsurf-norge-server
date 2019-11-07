const express = require("express");
const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const multer = require('multer');
const path = require('path');
const env = require('./const');

const router = express.Router();

const s3 = new aws.S3({
    accessKeyId: env.accessKeyId,
    secretAccessKey: env.secretAccessKey,
    Bucket: 'windsurf-norge'
});

const profileImgUpload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'windsurf-norge',
        acl: 'public-read',
        key: function (req, file, cb) {
            cb(null, path.basename(file.originalname, path.extname(file.originalname)) + '-' + Date.now() + path.extname(file.originalname))
        }
    }),
    limits: { fileSize: 4000000 }, // In bytes: 2000000 bytes = 2 MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('profileImage');

function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

router.post('/profile-img-upload', (req, res) => {
    profileImgUpload(req, res, (error) => {
        // console.log( 'requestOkokok', req.file );
        // console.log( 'error', error );
        if (error) {
            console.log('errors', error);
            res.json({ error: error });
        } else {
            // If File not found
            if (req.file === undefined) {
                console.log('Error: No File Selected!');
                res.json('Error: No File Selected');
            } else {
                // If Success
                const imageName = req.file.key;
                const imageLocation = req.file.location;
                // Save the file name into database into profile model
                res.json({
                    image: imageName,
                    location: imageLocation
                });
            }
        }
    });
});

const uploadsBusinessGallery = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'windsurf-norge',
        acl: 'public-read',
        key: function (req, file, cb) {
            cb(null, path.basename(file.originalname, path.extname(file.originalname)) + '-' + Date.now() + path.extname(file.originalname))
        }
    }),
    limits: { fileSize: 4000000 }, // In bytes: 2000000 bytes = 2 MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).array('galleryImage', 10);

router.post('/multiple-file-upload', (req, res) => {
    uploadsBusinessGallery(req, res, (error) => {
        console.log("Body: ", req.body);
        // console.log("Name: ", req.body.spot.name);
        // console.log('files', req.files);
        if (error) {
            console.log('errors', error);
            res.json({ error: error });
        } else {
            // If File not found
            if (req.files === undefined) {
                console.log('Error: No File Selected!');
                res.json('Error: No File Selected');
            } else {
                // If Success
                let fileArray = req.files,
                    fileLocation;
                const galleryImgLocationArray = [];
                for (let i = 0; i < fileArray.length; i++) {
                    fileLocation = fileArray[i].location;
                    console.log('filenm', fileLocation);
                    galleryImgLocationArray.push(fileLocation)
                }
                // Save the file name into database
                res.json({
                    filesArray: fileArray,
                    locationArray: galleryImgLocationArray
                });
            }
        }
    });
});

module.exports = router;