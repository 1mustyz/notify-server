const Company = require('../models/company')
const passport = require('passport');
const multer = require('multer');
const {singleUpload,singleAllMediaUpload,singleAudioUpload} = require('../middlewares/filesMiddleware');
const { uuid } = require('uuidv4');
const jwt =require('jsonwebtoken');
const csv = require('csv-parser')
const fs = require('fs')
const msToTime = require('../middlewares/timeMiddleware')
const math = require('../middlewares/math.middleware')
const randomstring = require("randomstring");
const cloudinary = require('cloudinary');
const mailgun = require("mailgun-js");
const DOMAIN = "sandbox09949278db4c4a108c6c1d3d1fefe2ff.mailgun.org";
const mg = mailgun({apiKey: "9bd20544d943a291e8833abd9e0c9908-76f111c4-8a189b96", domain: DOMAIN});
const cloudinaryUplouder = require('../middlewares/uploadCloudinary')

// cloudinary configuration for saving files
cloudinary.config({
    cloud_name: 'mustyz',
    api_key: '727865786596545',
    api_secret: 'HpUmMxoW8BkmIRDWq_g2-5J2mD8'
})


// staff registration controller
exports.registerCompany = async (req, res, next) => {
    try {

      //create the user instance
      req.body.username = randomstring.generate(10)
      user = new Company(req.body)
      const password = req.body.password ? req.body.password : 'password'
      //save the user to the DB
      await Company.register(user, password, function (error, user) {
        if (error) return res.json({ success: false, error }) 
        const newUser = {
          _id: user._id,
          username: user.username,
          companyName: user.companyName,
          email: user.email,
          phone: user.phone,
          email: user.email,
          address: user.address,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          __v: user.__v
        }
        const data = {
          from: "MAU@gmail.com",
          to: "onemustyfc@gmail.com",
          subject: "MAU DEFAULT PASSWORD",
          text: "Your default password is 'password'"
        };
        try {
          
          mg.messages().send(data, function (error, body) {
            console.log(body);
          });
          res.json({ success: true, newUser })
        } catch (error) {
          res.json({ success: false, newUser })
        }
      })
    } catch (error) {
      res.json({ success: false, error })
    }
  }

  // reset password
  exports.changePassword = async (req, res, next) => {
    const {username} = req.query
    Company.findOne({ username },(err, user) => {
      // Check if error connecting
      if (err) {
        res.json({ success: false, message: err }); // Return error
      } else {
        // Check if user was found in database
        if (!user) {
          res.json({ success: false, message: 'User not found' }); // Return error, user was not found in db
        } else {
          user.changePassword(req.body.oldpassword, req.body.newpassword, function(err) {
             if(err) {
                      if(err.name === 'IncorrectPasswordError'){
                           res.json({ success: false, message: 'Incorrect password' }); // Return error
                      }else {
                          res.json({ success: false, message: 'Something went wrong!! Please try again after sometimes.' });
                      }
            } else {
              res.json({ success: true, message: 'Your password has been changed successfully' });
             }
           })
        }
      }
    });
  }

exports.forgetPassword = async (req,res,next) => {

  const newPassword = math.randomNumber()
  try {

      const user = await Company.findOne({
        username: req.query.username
    });
    await user.setPassword(newPassword.toString());
    const updatedUser = await user.save();
    const data = {
      from: "MAU@gmail.com",
      to: "onemustyfc@gmail.com",
      subject: "CHANGED PASSWORD",
      text: `Your new password is ${newPassword}`
    };
    mg.messages().send(data, function (error, body) {
      console.log(body);
    });
    res.json({success:true, message:"Password have been reset and sent to email"})
  } catch (error) {
    res.json({success:false, message:error})
  }
    
}

  // staff login controller
exports.loginCompany = (req, res, next) => {

  let payLoad = {}
  // perform authentication
  passport.authenticate('company', (error, user, info) => {
    if (error) return res.json({ success: false, error })
    if (!user)
      return res.json({
        success: false,
        message: 'username or password is incorrect'
      })
    //login the user  
    req.login(user, (error) => {
      if (error){
        res.json({ success: false, message: 'something went wrong pls try again' })
      }else {
        req.session.user = user
        payLoad.id = user.username
        const token = jwt.sign(payLoad, 'myVerySecret');

        const newUser = {
          token: token,
          _id: user._id,
          username: user.username,
          companyName: user.companyName,
          email: user.email,
          phone: user.phone,
          email: user.email,
          image: user.image,
          address: user.address,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          __v: user.__v
        }
        
        res.json({ success: true, message: 'company login successful', newUser})
      }
    })
  })(req, res, next)
}

 


// find all company
exports.findAllCompany = async (req,res, next) => {

  try {
    const result = await Company.find({},{emergencies:0});
    result.length > 0
    ? res.json({success: true, message: result,})
    : res.json({success: false, message: result,})
  } catch (error) {
    console.log(error)
  }
  
}


// find single Company
exports.singleCompany = async (req,res, next) => {
  const {username} = req.query
  try {
    const result = await Company.findOne({username: username});
    result
     ? res.json({success: true, message: result,})
     : res.json({success: false, message: result,})
    
  } catch (error) {
    console.log(error)
  }
}

// set profile pic
exports.setProfilePic = async (req,res, next) => {
  
  singleUpload(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
    return res.json(err.message);
    }
    else if (err) {
      return res.json(err);
    }
    else if (!req.file) {
      return res.json({"image": req.file, "msg":'Please select an image to upload'});
    }
    if(req.file){

      
        const result = await Company.findOne({username: req.query.username},{_id: 0,image: 1})
        

        if (result.image != null){
          const imageName = result.image.split('/').splice(7)
          console.log('-----------------',imageName)
  
          cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
          {
            invalidate: true,
            resource_type: "raw"
        }, 
          function(error,result) {
            console.log(result, error) 
          }); 
        }

      cloudinary.v2.uploader.upload(req.file.path, 
        { resource_type: "raw" }, 
        async function(error, result) {
        console.log('111111111111111111',result, error); 

        
        await Company.findOneAndUpdate({username: req.query.username},{$set: {image: result.secure_url}})
        const editedStaff = await Company.findOne({username: req.query.username},{emergencies:0})
        
        res.json({success: true,
          message: editedStaff,
                     },
        
    );
        });
     
       
    }
       
    });

    
        
  
}

// edit Company
exports.editCompany = async (req,res,next) => {
  try {
    const {username} = req.query;
    await Company.findOneAndUpdate({username: username}, req.body)
    res.json({success: true, message: `Company with the ID ${username} has been edited`})
    
  } catch (error) {
    console.log(error)
  }
}


/**** Emergencies START HERE     ****//////////////////////////////////////////////

// get emergencies
exports.getEmergencies = async (req,res, next) => {
  const {companyId} = req.query
  try {
    const result = await Company.findOne({username:companyId},{emergencies:1});
    res.json({success: true, message: result,})
    
  } catch (error) {
    console.log(error)
    
  }
}

// get single emergency
exports.getSingleEmergency = async (req,res, next) => {
  const {emergencyId} = req.query
  try {
    const result = await Company.findOne({"emergencies.emergencyId":emergencyId},{emergencies:1});
    console.log(result)
    const singleEmergency = result.emergencies.filter(emgy => emgy.emergencyId == emergencyId)
    res.json({success: true, message: singleEmergency,})
    
  } catch (error) {
    console.log(error)
    
  }
}

// delete emergency

exports.deleteEmergency = async (req,res, next) => {
  const {emergencyId} = req.query
  try {
    const result = await Company.findOne({"emergencies.emergencyId":emergencyId},{emergencies:1});
    let singleEmergency = result.emergencies.filter(emgy => emgy.emergencyId == emergencyId)
    console.log(singleEmergency[0])
    const cDelete = async ()=>{

      if(singleEmergency[0].image != undefined)  await cloudinaryUplouder.delete(singleEmergency[0].image)
      if(singleEmergency[0].audio != undefined)  await cloudinaryUplouder.delete(singleEmergency[0].audio)
      if(singleEmergency[0].video != undefined)  await cloudinaryUplouder.delete(singleEmergency[0].video)
    }
    const myPromise = new Promise(async (resolve, reject) => {
      resolve(cDelete())
    });

    myPromise.then( async ()=>{
      singleEmergency = await Company.findOneAndUpdate({"emergencies.emergencyId":emergencyId},{$pull:{"emergencies":{"emergencyId":emergencyId}}},{new:true})
      res.json({success: true, message: singleEmergency})
    })
    
  } catch (error) {
    console.log(error)
    
  }
}

exports.removeCompany = async (req,res,next) => {
  const {companyId} = req.query;
  let result
  try {

    const resultImage = await Company.findOne({"username":companyId})
    const deleteAllEmergencies = async () => {
      resultImage.emergencies.map(async (emg)=>{
        // console.log(emg)
  
        if (emg.image != undefined) await cloudinaryUplouder.delete(emg.image)
        if (emg.audio != undefined) await cloudinaryUplouder.delete(emg.audio)
        if (emg.video != undefined) await cloudinaryUplouder.delete(emg.video)
  
        
      })    
      if (resultImage.image != null) await cloudinaryUplouder.delete(resultImage.image)
    }
    
    const myPromise = new Promise(async (resolve, reject) => {
      resolve(deleteAllEmergencies())
    });

    myPromise.then(async ()=>{

      await Company.findOneAndDelete({"username": companyId})
      result = await Company.find({},{_id:0,emergencies:0})
      res.json({success: true, message: `Company with the ID ${companyId} has been removed`, result})
    })
   
    

  } catch (error) {
    console.log(error)
    
  }
}



// upload medias
exports.uploadMedias = async (req,res, next) => {
  const {companyId} = req.query
  let media = {}
  let result
  media.emergencyId = randomstring.generate(8)
  media.date = new Date()
  try {
    singleAllMediaUpload(req, res, async function(err) {
      // console.log(req.files,req.media)
      if (err instanceof multer.MulterError) {
      return res.json(err.message);
      }
      else if (err) {
        return res.json(err);
      }else if(req.files.length > 0 || req.body.message){
        req.files.map(async (file)=>{
          if(file.mimetype == 'image/png' || file.mimetype == 'image/jpeg') media.image = file.path
          if(file.mimetype == "audio/mp3" || file.mimetype == "audio/mpeg") media.audio = file.path
          if(file.mimetype == "video/mp4") media.video = file.path
        })
        if (req.body.message) media.message = req.body.message
        if (req.body.position) media.position = req.body.position
        const cUpload = async ()=>{
  
          if(media.image != undefined) media.image = await cloudinaryUplouder.upload(media.image)
          if(media.audio != undefined) media.audio = await cloudinaryUplouder.upload(media.audio)
          if(media.video != undefined) media.video = await cloudinaryUplouder.upload(media.video)
        }
        const myPromise = new Promise(async (resolve, reject) => {
          resolve(cUpload())
        });
  
        myPromise.then(async ()=>{
          await Company.findOneAndUpdate({"username":companyId},{$push:{"emergencies":media}},{new:true})
          result = await Company.findOne({username:companyId},{emergencies:1})
          res.json({success:true,result})
        })
  
      }
  
         
    });
  
    
  } catch (error) {
    console.log(error)
  }

        
  
}

