var express = require('express');
var router = express.Router();
const adminController = require('../controllers/adminController')
const passport = require('passport');


/** All post request *//////////////////////////////////////////////

// register staff route
router.post('/register-company',  adminController.registerCompany)

// add image to an event
router.put('/trigger-notification',  adminController.uploadMedias)
// router.put('/upload-a-video',  adminController.uploadVideo)

// set profie pic
router.put('/set-profile-pic',  adminController.setProfilePic)

// edit home page event
router.put('/edit-company', adminController.editCompany)


// login staff
router.post('/login', adminController.loginCompany)


// /** All get request *///////////////////////////////////////////////////////////////

// get all company
router.get('/get-all-company', adminController.findAllCompany)


// get single staff
router.get('/get-single-company', adminController.singleCompany)

// get all company emergencies
router.get('/get-all-company-emergencies', adminController.getEmergencies)

// get single emergency
router.get('/get-single-emergency', adminController.getSingleEmergency)

// remove emergency
router.put('/remove-emergency', adminController.deleteEmergency)

// remove department program
router.delete('/remove-company', adminController.removeCompany)


module.exports = router;