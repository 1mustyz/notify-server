var express = require('express');
var router = express.Router();
const adminController = require('../controllers/adminController')
const passport = require('passport');


/** All post request *//////////////////////////////////////////////

// register staff route
router.post('/register-staff',  adminController.registerStaff)

// create client from a file
// router.post('/create-client-from-file', adminController.registerClientFromAfile)

// create faculty
router.post('/add-faculty', adminController.addFaculty)

// create main event
router.put('/create-home-event',  adminController.addHomeEvent)

// add image to an event
router.put('/upload-an-image',  adminController.addAnImageToEvent)

// set profie pic
router.put('/set-profile-pic',  adminController.setProfilePic)

// edit home page event
router.put('/edit-homepage-event', adminController.editEvent)


// login staff
router.post('/login', adminController.loginStaff)


/** All get request *///////////////////////////////////////////////////////////////

// get all staff
router.get('/get-all-staff', adminController.findAllStaff)
router.post('/mail', adminController.mall)


// get single staff
router.get('/get-single-staff', adminController.singleStaff)

// get home event
router.get('/get-home-event', adminController.getHomeEvent)

// get all faculties
router.get('/get-all-faculties', adminController.getAllFaculties)

// get single faculty
router.get('/get-single-faculty', adminController.singleFaculty)

// get single department
router.get('/get-single-department', adminController.getSingleDepartment)

// get all department
router.get('/get-all-department', adminController.getAllDepartment)


// remove event 
router.put('/remove-event', adminController.removeEvent)

// edit faculty
router.put('/edit-faculty', adminController.editFaculty)

// edit dean
router.put('/edit-dean', adminController.editDean)

// edit department
router.put('/edit-department', adminController.editDepartment)

// edit hod 
router.put('/edit-hod', adminController.editHod)

// edit department program 
router.put('/edit-department-program', adminController.editDepartmentProgram)

// edit department staff
router.put('/edit-department-staff', adminController.editDepartmentStaffs)

// add dean
router.put('/add-dean', adminController.addDean)

// add department
router.put('/add-department', adminController.addDepartment)

// add hod
router.put('/add-hod', adminController.addHod)

// add department staff
router.put('/add-department-staff', adminController.addDepartmentStaff)

// add department program
router.put('/add-department-program', adminController.addDepartmentProgram)

// remove dean
router.put('/remove-dean', adminController.removeDean)

// remove department program
router.put('/remove-department-program', adminController.removeDepartmentProgram)

// remove department staff
router.put('/remove-department-staff', adminController.removeDepartmentStaff)

// remove hod
router.put('/remove-hod', adminController.removeHod)

// remove department
router.put('/remove-department', adminController.removeDepartment)

// remove faculty
router.delete('/remove-faculty', adminController.removeFaculty)


module.exports = router;