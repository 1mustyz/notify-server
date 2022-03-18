const Staff = require('../models/staff')
const passport = require('passport');
const Faculty = require('../models/faculty')
const multer = require('multer');
const {singleUpload,singleFileUpload} = require('../middlewares/filesMiddleware');
const { uuid } = require('uuidv4');
const jwt =require('jsonwebtoken');
const csv = require('csv-parser')
const fs = require('fs')
const msToTime = require('../middlewares/timeMiddleware')
const math = require('../middlewares/math.middleware')
const randomstring = require("randomstring");
const cloudinary = require('cloudinary');
const mailgun = require("mailgun-js");
const HomePage = require('../models/homePage');
const DOMAIN = "sandbox09949278db4c4a108c6c1d3d1fefe2ff.mailgun.org";
const mg = mailgun({apiKey: "9bd20544d943a291e8833abd9e0c9908-76f111c4-8a189b96", domain: DOMAIN});

// cloudinary configuration for saving files
cloudinary.config({
    cloud_name: 'mustyz',
    api_key: '727865786596545',
    api_secret: 'HpUmMxoW8BkmIRDWq_g2-5J2mD8'
})

exports.mall = async (req,res,next) => {
  cloudinary.v2.api.delete_resources_by_prefix('bc7crytwzlexeg8ubxt3.jpg', 
  {
    invalidate: true,
    resource_type: "raw"
}, 
  function(error,result) {
    console.log(result, error) });   

} 
// staff registration controller
exports.registerStaff = async (req, res, next) => {
    try {

      //create the user instance
      user = new Staff(req.body)
      const password = req.body.password ? req.body.password : 'password'
      //save the user to the DB
      await Staff.register(user, password, function (error, user) {
        if (error) return res.json({ success: false, error }) 
        const newUser = {
          _id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          image: user.image,
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
    Staff.findOne({ username },(err, user) => {
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

      const user = await Staff.findOne({
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
exports.loginStaff = (req, res, next) => {

  let payLoad = {}
  // perform authentication
  passport.authenticate('staff', (error, user, info) => {
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
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          image: user.image,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          __v: user.__v
        }
        
        res.json({ success: true, message: 'staff login successful', newUser})
      }
    })
  })(req, res, next)
}

 

// logout
exports.logout = (req, res,next) => {

  console.log(req.session)

  if (req.session.user.role == "admin"){

      req.logout();
      res.json({success: true, message: "logout successfully"});
  }
}

// find all staff
exports.findAllStaff = async (req,res, next) => {

  const result = await Staff.find({});
  result.length > 0
   ? res.json({success: true, message: result,})
   : res.json({success: false, message: result,})
}


// find single staff
exports.singleStaff = async (req,res, next) => {
  const {username} = req.query

  const result = await Staff.findOne({username: username});
  result
   ? res.json({success: true, message: result,})
   : res.json({success: false, message: result,})
}

// set profile pic
exports.setProfilePic = async (req,res, next) => {

  try {
    fs.rmSync('./public/images', { recursive: true });
  } catch(err) {
    console.error(err)
  }

  const dir = './public/images';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true
      });
    }

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

      // console.log(Object.keys(req.query).length)
      // try {
      //   fs.unlinkSync(req.file.path)
      //   //file removed
      // } catch(err) {
      //   console.error(err)
      // }

        const result = await Staff.findOne({username: req.query.username},{_id: 0,image: 1})
        

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

        
        await Staff.findOneAndUpdate({username: req.query.username},{$set: {image: result.secure_url}})
        const editedStaff = await Staff.findOne({username: req.query.username})
        
        res.json({success: true,
          message: editedStaff,
                     },
        
    );
        });
     
       
    }
       
    });

    
        
  
}

// delete or remove staff
exports.removeStaff = async (req,res,next) => {
  const {username} = req.query;
  await Staff.findOneAndDelete({username: username})
  res.json({success: true, message: `staff with the id ${username} has been removed`})
}

// edit staff
exports.editStaff = async (req,res,next) => {
  const {username} = req.query;
  await Staff.findOneAndUpdate({username: username}, req.body)
  res.json({success: true, message: `staff with the username ${username} has been edited`})
}


/**** HOMEPAGE START HERE     ****//////////////////////////////////////////////

// Add main event
exports.addHomeEvent = async (req,res,next) => {
  const {evnt,homeEventType} = req.body
  evnt.evntId = randomstring.generate(8)
  const homePage = await HomePage.find()
  console.log(homePage)
  let result

  if (homePage.length == 0){
    await HomePage.collection.insertOne({
      "mainEvents" : [],
      "newsEvents": [],
      "programs": [],
      "vc": {}
    })
  }

  if(homeEventType == "vc"){
    result = await HomePage.findOneAndUpdate({},{$set:{[homeEventType]:evnt}},{new:true})
  }else{

    result = await HomePage.findOneAndUpdate({},{$push:{[homeEventType]:evnt}},{new:true})
  }

  res.json({success: true, message: 'Event created successfullty', result, newlyEvent:evnt});
}

exports.getHomeEvent = async (req,res, next) => {
  try {
    const result = await HomePage.find({});
    result.length > 0
     ? res.json({success: true, message: result,})
     : res.json({success: false, message: result,})
    
  } catch (error) {
    res.json({success: false, error})
    
  }
}

// Add event pic
exports.addAnImageToEvent = async (req,res, next) => {
  const {eventName,eventId,activity,facultyId,departmentId} = req.query
  let allResults
  try {
    fs.rmSync('./public/images', { recursive: true });
  } catch(err) {
    console.error(err)
  }


  const dir = './public/images';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true
      });
    }

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
      // console.log('1111111',req.file)

      if(activity == "homepage"){

        const result = await HomePage.findOne({},{_id: 0,[eventName]: 1})
        
        const resultFilter = result[eventName].filter((evnt)=>{
          return evnt.evntId == eventId
        })
        console.log(resultFilter[0].image)
        if(resultFilter[0].image != undefined){
        // console.log('222222','hshsisi')

          
          const imageName = resultFilter[0].image.split('/').splice(7)
          console.log('-----------------',imageName)

           cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
          {
            invalidate: true,
              resource_type: "raw"
          }, 
            function(error,result) {
              // console.log('33333333',result, error)
            });  
        }

        cloudinary.v2.uploader.upload(req.file.path, 
        { resource_type: "raw" }, 
        async function(error, result) {
          // console.log('444444',result, error); 

          if(eventName == "mainEvents"){

            allResults = await HomePage.findOneAndUpdate({"mainEvents.evntId": eventId},{$set: {"mainEvents.$.image": result.secure_url}},{new:true})
          }else if(eventName == "newsEvents"){
            allResults = await HomePage.findOneAndUpdate({"newsEvents.evntId": eventId},{$set: {"newsEvents.$.image": result.secure_url}},{new:true})
          }else if (eventName == "programs"){
            allResults = await HomePage.findOneAndUpdate({"programs.evntId": eventId},{$set: {"programs.$.image": result.secure_url}},{new:true})
          }else{
            res.json({success: false, message:"used of wrong parameters and queries"})
          }  
          // const editedStaff = await Staff.findOne({username: req.query.username})
          
          res.json({success: true,
            message: allResults,
                      },
          
          );
        });
     
       
      
      }else if(activity == "vc"){
        const result = await HomePage.findOne({},{_id: 0,[activity]: 1})
        
        // const resultFilter = result[activity].filter((evnt)=>{
        //   return evnt.evntId == eventId
        // })
        console.log(result[activity].image)
        if(result[activity].image != undefined){
        // console.log('222222','hshsisi')

          
          const imageName = result[activity].image.split('/').splice(7)
          console.log('-----------------',imageName)

           cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
          {
            invalidate: true,
              resource_type: "raw"
          }, 
            function(error,result) {
              // console.log('33333333',result, error)
            });  
        }

        cloudinary.v2.uploader.upload(req.file.path, 
        { resource_type: "raw" }, 
        async function(error, result) {
          // console.log('444444',result, error); 

          allResults = await HomePage.findOneAndUpdate({},{$set: {"vc.image": result.secure_url}},{new:true})

         
          
          res.json({success: true,
            message: allResults,
                      },
          
          );
        });
     


      }else if(activity == "faculty"){
        const result = await Faculty.findOne({facultyId},{_id: 0,image: 1})
        
       
        console.log(result.image)
        if(result.image != null){
        // console.log('222222','hshsisi')

          
        const imageName = result.image.split('/').splice(7)
        console.log('-----------------',imageName)

           cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
          {
            invalidate: true,
              resource_type: "raw"
          }, 
            function(error,result) {
              // console.log('33333333',result, error)
            });  
        }

        cloudinary.v2.uploader.upload(req.file.path, 
        { resource_type: "raw" }, 
        async function(error, result) {
          // console.log('444444',result, error); 

            await Faculty.findOneAndUpdate({facultyId},{$set: {"image": result.secure_url}},{new:true})
            const allResults = await Faculty.find({},{dean:0,departmentList:0})
         
          
          res.json({success: true,
            message: allResults,
                      },
          
          );
        });
     


      }else if(activity == "dean"){
        const result = await Faculty.findOne({facultyId},{_id: 0,dean: 1})
        
       
        console.log(result.dean.image)
        if(result.dean.image != null){
        // console.log('222222','hshsisi')

          
        const imageName = result.dean.image.split('/').splice(7)
        console.log('-----------------',imageName)

           cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
          {
            invalidate: true,
              resource_type: "raw"
          }, 
            function(error,result) {
              // console.log('33333333',result, error)
            });  
        }

        cloudinary.v2.uploader.upload(req.file.path, 
        { resource_type: "raw" }, 
        async function(error, result) {
          // console.log('444444',result, error); 

            await Faculty.findOneAndUpdate({facultyId},{$set: {"dean.image": result.secure_url}},{new:true})
            const allResults = await Faculty.find({facultyId})
         
          
          res.json({success: true,
            message: allResults,
                      },
          
          );
        });

      }else if(activity == "department"){
        const result = await Faculty.findOne({"departmentList.departmentId":departmentId},{_id: 0,departmentList:1})
        resultFilter = result.departmentList.filter((dpt)=>{
          return dpt.departmentId == departmentId
        })
        
        console.log(resultFilter[0].image)
        if(resultFilter[0].image != null){
        // console.log('222222','hshsisi')

          
        const imageName = resultFilter[0].image.split('/').splice(7)
        console.log('-----------------',imageName)

           cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
          {
            invalidate: true,
              resource_type: "raw"
          }, 
            function(error,result) {
              // console.log('33333333',result, error)
            });  
        }

        cloudinary.v2.uploader.upload(req.file.path, 
        { resource_type: "raw" }, 
        async function(error, result) {
          // console.log('444444',result, error); 

            await Faculty.findOneAndUpdate({"departmentList.departmentId":departmentId},{$set: {"departmentList.$.image": result.secure_url}},{new:true})
            const allResults = await Faculty.find({"departmentList.departmentId":departmentId})
         
          
          res.json({success: true,
            message: allResults,
                      },
          
          );
        });

      }else if(activity == "hod"){
        const result = await Faculty.findOne({"departmentList.departmentId":departmentId},{_id: 0,departmentList:1})
        resultFilter = result.departmentList.filter((dpt)=>{
          return dpt.departmentId == departmentId
        })
        
        console.log(resultFilter[0].hod.image)
        if(resultFilter[0].hod.image != null){
        // console.log('222222','hshsisi')

          
        const imageName = resultFilter[0].image.split('/').splice(7)
        console.log('-----------------',imageName)

           cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
          {
            invalidate: true,
              resource_type: "raw"
          }, 
            function(error,result) {
              // console.log('33333333',result, error)
            });  
        }

        cloudinary.v2.uploader.upload(req.file.path, 
        { resource_type: "raw" }, 
        async function(error, result) {
          // console.log('444444',result, error); 

            await Faculty.findOneAndUpdate({"departmentList.departmentId":departmentId},{$set: {"departmentList.$.hod.image": result.secure_url}},{new:true})
            const allResults = await Faculty.find({"departmentList.departmentId":departmentId})
         
          
          res.json({success: true,
            message: allResults,
                      },
          
          );
        });

      }
    }
  });
  
    
        
  
}


// edit event
exports.editEvent = async (req,res,next) => {
  let allEvents
  const {eventId,evnt,eventName} = req.body;
  if(eventName == "mainEvents"){

    allEvents = await HomePage.findOneAndUpdate({"mainEvents.evntId": eventId},{$set: {"mainEvents.$.header": evnt.header, "mainEvents.$.description": evnt.description, "mainEvents.$.description": evnt.subHeader}},{new:true})
  }else if(eventName == "newsEvents"){
    allEvents = await HomePage.findOneAndUpdate({"newsEvents.evntId": eventId},{$set: {"newsEvents.$.header": evnt.header, "newsEvents.$.description": evnt.description, "newsEvents.$.description": evnt.subHeader}},{new:true})
  }else if (eventNamee == "programs"){
    allEvents = await HomePage.findOneAndUpdate({"programs.evntId": eventId},{$set: {"programs.$.header": evnt.header, "programs.$.description": evnt.description,"programs.$.subHeader": evnt.subHeader}},{new:true})

  }else{
  res.json({success: false, message: `wrong parameters`})

  }
  const result = await HomePage.findOne({},{_id: 0,[eventName]: 1})
        
    const resultFilter = result[eventName].filter((evnt)=>{
      return evnt.evntId == eventId
    })

  res.json({success: true, allEvents,editedEvent:resultFilter})
}


// // register a client from a file
// exports.registerClientFromAfile = async (req,res,next) => {

//   const clients = []

//   singleFileUpload(req, res, async function(err) {
//     if (err instanceof multer.MulterError) {
//     return res.json(err.message);
//     }
//     else if (err) {
//       return res.json(err);
//     }
//     else if (!req.file) {
//       return res.json({"file": req.file, "msg":'Please select file to upload'});
//     }
//     if(req.file){
//         console.log(req.file.path)

//         fs.createReadStream(req.file.path)
//         .pipe(csv({}))
//         .on('data', (data)=> clients.push(data))
//         .on('end', async () => {
//           // console.log(clients)
//           clients.map(client => {
//             client.clientId = randomstring.generate(8)
//           })
//           console.log(clients)
//           const clientes = await Client.insertMany(clients)

//           try {
//             fs.unlinkSync(req.file.path)
//             //file removed
//           } catch(err) {
//             console.error(err)
//           }
//           res.json({success:true, message: clientes})
//         })

       
//     }
//     });    


  




// }


// delete or remove homePage event
exports.removeEvent = async (req,res,next) => {
  const {eventName,eventId} = req.query;
  const result = await HomePage.findOne({},{_id: 0,[eventName]: 1})
        
  const resultFilter = result[eventName].filter((evnt)=>{
    return evnt.evntId == eventId
  })

  if (resultFilter[0].image != undefined || resultFilter[0].image != null){
    const imageName = resultFilter[0].image.split('/').splice(7)
    console.log('-----------------',imageName)

      cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
    {
      invalidate: true,
        resource_type: "raw"
    }, 
    function(error,result) {
      console.log('33333333',result, error)
    });  
  }
  


  await HomePage.findOneAndUpdate({evntId:eventId},{$pull:{[eventName]:{evntId: eventId}}})
  res.json({success: true, message: `Event with the id ${eventId} has been removed`})
}

// add faculty
exports.addFaculty = async (req,res,next) => {
  const {faculty} = req.body
  faculty.facultyId = randomstring.generate(8)
  faculty.image = null
  faculty.dean = null
  faculty.departmentList = []
  let result
  
  try {
    await Faculty.collection.insertOne(faculty)
    result = await Faculty.find({},{dean:0, departmentList:0})
  } catch (error) {
  res.json({success: false, error});
    
  }
  res.json({success: true, message: 'Faculty created successfullty', result});
}

// getall faculties
exports.getAllFaculties = async (req,res, next) => {
  try {
    const result = await Faculty.find({},{facultyName:1,facultyId:1,_id:0});
    result.length > 0
     ? res.json({success: true, message: result,})
     : res.json({success: false, message: result,})
    
  } catch (error) {
    res.json({success: false, error})
    
  }
}

// find single faculty
exports.singleFaculty = async (req,res, next) => {
  const {facultyId} = req.query
  try {
    let result = await Faculty.findOne({facultyId});
    let resulty
    
    if (result){
      const dptList = result.departmentList.map((dpt)=>{
        return {
          "departmentName":dpt.departmentName,
          "departmentId":dpt.departmentId
        }
      })

      resulty = {
        "facultyName":result.facultyName,
        "facultyDescription":result.facultyDescription,
        "shortNote":result.shortNote,
        "image":result.image,
        "dean":result.dean,
        "facultyId":result.facultyId,
        "departmentList":dptList
      }
      
      res.json({success: true, message: resulty,})
    }else res.json({success: false, message: result,})
    
    
  } catch (error) {
    console.log({success: false, error})
  }
}

// get single department
exports.getSingleDepartment = async (req,res, next) => {
  const {departmentId} = req.query
  let result = await Faculty.findOne({"departmentList.departmentId": departmentId},{departmentList:1});
  result = result.departmentList.filter((dpt)=>{
    return dpt.departmentId == departmentId
  })
  
  // console.log(som)
  result
   ? res.json({success: true, message: result,})
   : res.json({success: false, message: result,})
}

// get all department
exports.getAllDepartment = async (req,res, next) => {
  let result = await Faculty.find({},{departmentList:1, _id:0});
  let resulty = []
  result.map((dpt)=>{
    dpt.departmentList.map((innerDpt)=>{

      resulty.push(innerDpt) 
    })
  })
  console.log(resulty)
  
  result
   ? res.json({success: true, message: resulty,})
   : res.json({success: false, message: result,})
}

// edit faculty
exports.editFaculty = async (req,res,next) => {
  const {facultyId} = req.query;
  const {faculty} = req.body
  let result
  try {
    await Faculty.findOneAndUpdate({facultyId}, faculty,{new:true})
    result = await Faculty.find({},{dean:0,departmentList:0})
    
  } catch (error) {
    res.json({success: false, error})
  }
  res.json({success: true, message: `Faculty with the ID ${facultyId} has been edited`,result})
}

// delete or remove faculty
exports.removeFaculty = async (req,res,next) => {
  const {facultyId,departmentId} = req.query;
  let result
  try {

    const resultImage = await Faculty.findOne({"facultyId":facultyId})
    const resultImageFilter = resultImage.departmentList.map((dpt)=>{

      if (dpt.image != null){
        const imageNameDep = dpt.image.split('/').splice(7)
        console.log('-----------------',imageNameDep)
  
            cloudinary.v2.api.delete_resources_by_prefix(imageNameDep[0], 
        {
          invalidate: true,
            resource_type: "raw"
        }, 
          function(error,result) {
            // console.log('33333333',result, error)
        });
      }
      
      if (dpt.hod.image){
        const imageNameHod = dpt.hod.image.split('/').splice(7)
      console.log('-----------------',imageNameHod)

          cloudinary.v2.api.delete_resources_by_prefix(imageNameHod[0], 
      {
        invalidate: true,
          resource_type: "raw"
      }, 
        function(error,result) {
          // console.log('33333333',result, error)
      });
      }
      
    })    
    
    // delete faculty image from server
    if(resultImage.image != null){
      // console.log('222222','hshsisi')
      
      
      const imageName = resultImage.image.split('/').splice(7)
      console.log('-----------------',imageName)

          cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
      {
        invalidate: true,
          resource_type: "raw"
      }, 
        function(error,result) {
          // console.log('33333333',result, error)
      });  
    }

    // delete faculty image from server
    if(resultImage.dean.image != null){
      // console.log('222222','hshsisi')
      
      
      const imageName = resultImage.dean.image.split('/').splice(7)
      console.log('-----------------',imageName)

          cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
      {
        invalidate: true,
          resource_type: "raw"
      }, 
        function(error,result) {
          // console.log('33333333',result, error)
      });  
    }

    console.log(resultImageFilter)
    await Faculty.findOneAndDelete({facultyId: facultyId})
    result = await Faculty.find({},{dean:0,departmentList:0})

  } catch (error) {
  res.json({success: false, error})
    
  }
  res.json({success: true, message: `Faculty with the ID ${facultyId} has been removed`, result})
}


// add Dean
exports.addDean = async (req,res,next) => {
  const {dean,facultyId} = req.body
  dean.image = null
  let result
  
  try {
    result = await Faculty.findOneAndUpdate(facultyId,{"dean":dean},{new:true})
  } catch (error) {
  res.json({success: false, error});
    
  }
  res.json({success: true, message: 'Dean created successfullty', result});
}

// edit dean
exports.editDean = async (req,res,next) => {
  const {facultyId} = req.query;
  const {dean} = req.body
  let result
  try {
    const din = await Faculty.find({facultyId},{dean:1, _id:0})
    console.log(din)
    if (din[0].dean.image != null) dean.image = din[0].dean.image
    else dean.image = null
    result = await Faculty.findOneAndUpdate({facultyId}, {"dean":dean},{new:true})
    
  } catch (error) {
    res.json({success: false, error})
  }
  res.json({success: true, message: `Dean from faculty with the ID ${facultyId} has been edited`,result})
}

// delete or remove dean
exports.removeDean = async (req,res,next) => {
  const {facultyId} = req.query;
  let result
  try {
    const resultImage = await Faculty.findOne({facultyId},{_id: 0,dean: 1})
        
       
        console.log(resultImage.dean.image)
        if(resultImage.dean.image != null){
        // console.log('222222','hshsisi')

          
        const imageName = resultImage.dean.image.split('/').splice(7)
        console.log('-----------------',imageName)

           cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
          {
            invalidate: true,
              resource_type: "raw"
          }, 
            function(error,result) {
              // console.log('33333333',result, error)
            });  
        }
    result = await Faculty.findOneAndUpdate({facultyId: facultyId},{"dean":null},{new:true})

    
  } catch (error) {
  res.json({success: false, error})
    
  }
  res.json({success: true, message: `Dean from faculty with the ID ${facultyId} has been removed`, result})
}

// add department
exports.addDepartment = async (req,res,next) => {
  const {department,facultyId} = req.body
  department.departmentId = randomstring.generate(8)

  let result
  
  try {
    result = await Faculty.findOneAndUpdate({facultyId:facultyId},{$push:{"departmentList":department}},{new:true})
  } catch (error) {
  res.json({success: false, error});
    
  }
  res.json({success: true, message: 'Department created successfullty', result});
}

// edit department
exports.editDepartment = async (req,res,next) => {
  const {facultyId,departmentId} = req.query;
  const {department} = req.body
  let result
  try {
    result = await Faculty.findOneAndUpdate(
      {"departmentList.departmentId":departmentId},
      {$set:{
        "departmentList.$.departmentName":department.departmentName,
        "departmentList.$.mission":department.mission,
        "departmentList.$.vission":department.vission
      }},{new:true})
    
  } catch (error) {
    res.json({success: false, error})
  }
  res.json({success: true, message: `Department from faculty with the ID ${facultyId} has been edited`,result})
}

// add HOD
exports.addHod = async (req,res,next) => {
  const {hod,departmentId} = req.body
  hod.image = null

  let result
  
  try {
    result = await Faculty.findOneAndUpdate({"departmentList.departmentId":departmentId},{$set:{"departmentList.$.hod":hod}},{new:true})
  } catch (error) {
  res.json({success: false, error});
    
  }
  res.json({success: true, message: 'HOD created successfullty', result});
}

// add department staff
exports.addDepartmentStaff = async (req,res,next) => {
  const {staff,departmentId} = req.body
  staff.staffId = randomstring.generate(8)

  let result
  
  try {
    result = await Faculty.findOneAndUpdate({"departmentList.departmentId":departmentId},{$push:{"departmentList.$.staffList":staff}},{new:true})
  } catch (error) {
  res.json({success: false, error});
    
  }
  res.json({success: true, message: 'Staff created successfullty', result});
}

// add department programs
exports.addDepartmentProgram = async (req,res,next) => {
  const {program,departmentId} = req.body
  program.programId = randomstring.generate(8)

  let result
  
  try {
    result = await Faculty.findOneAndUpdate({"departmentList.departmentId":departmentId},{$push:{"departmentList.$.programs":program}},{new:true})
  } catch (error) {
  res.json({success: false, error});
    
  }
  res.json({success: true, message: 'Program created successfullty', result});
}

// edit hod
exports.editHod = async (req,res,next) => {
  const {departmentId} = req.query;
  const {hod} = req.body
  let result
  try {
    result = await Faculty.findOneAndUpdate(
      {"departmentList.departmentId":departmentId},
      {$set:{
        "departmentList.$.hod.name":hod.name,
        "departmentList.$.hod.qualification":hod.qualification,
      }},{new:true})
    
  } catch (error) {
    res.json({success: false, error})
  }
  res.json({success: true, message: `HOD from faculty with the ID ${departmentId} has been edited`,result})
}

// edit department program
exports.editDepartmentProgram = async (req,res,next) => {
  const {departmentId,programId,facultyId} = req.query;
  const {program} = req.body
  console.log(program)
  let result
  try {
    await Faculty.findOneAndUpdate(
      {"facultyId":facultyId},
      {$set:{
        "departmentList.$[e1].programs.$[e2].name":program.name,
        "departmentList.$[e1].programs.$[e2].mission":program.mission,
        "departmentList.$[e1].programs.$[e2].addmissionRequirement":program.addmissionRequirement,
      }},
      { 
        arrayFilters: [
          {"e1.departmentId": departmentId},
          { "e2.programId": programId}],
      })

    result = await Faculty.findOne({"facultyId":facultyId})

    
  } catch (error) {
    console.log({success: false, error})
  }
  res.json({success: true, message: `Program from department with the ID ${departmentId} has been edited`,result})
}

// edit department staffs
exports.editDepartmentStaffs = async (req,res,next) => {
  const {departmentId,staffId,facultyId} = req.query;
  const {staff} = req.body
  let result
  try {
    await Faculty.findOneAndUpdate(
      {"facultyId":facultyId},
      {$set:{
        "departmentList.$[e1].staffList.$[e2].name":staff.name,
        "departmentList.$[e1].staffList.$[e2].qualification":staff.qualification
      }},
      { 
        arrayFilters: [
          {"e1.departmentId": departmentId},
          { "e2.staffId": staffId}],
      }
      )
      result = await Faculty.findOne({"facultyId":facultyId})
    
  } catch (error) {
    console.log({success: false, error})
  }
  res.json({success: true, message: `Staff from department with the ID ${departmentId} has been edited`,result})
}

// delete or hod
exports.removeHod = async (req,res,next) => {
  const {departmentId,facultyId} = req.query;
  let result
  try {
    const resultImage = await Faculty.findOne({"departmentList.departmentId":departmentId},{_id:0,departmentList:1})
    const resultImageFilter = resultImage.departmentList.filter((dpt)=>{
      return dpt.departmentId == departmentId
    })    
    
    console.log(resultImageFilter)
    if(resultImageFilter[0].hod.image != null){
      // console.log('222222','hshsisi')
      
      
        const imageName = resultImageFilter[0].hod.image.split('/').splice(7)
        console.log('-----------------',imageName)

           cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
          {
            invalidate: true,
              resource_type: "raw"
          }, 
            function(error,result) {
              // console.log('33333333',result, error)
            });  
        }
    await Faculty.findOneAndUpdate({"departmentList.departmentId":departmentId},{$set:{"departmentList.$.hod":null}})
    result = await Faculty.findOne({"facultyId":facultyId})
    
  } catch (error) {
  console.log({success: false, error})
    
  }
  res.json({success: true, message: `HOD from department with the ID ${departmentId} has been removed`, result})
}

// delete or department program
exports.removeDepartmentProgram = async (req,res,next) => {
  const {departmentId,programId,facultyId} = req.query;
  let result
  try {
    
    await Faculty.findOneAndUpdate(
      {"facultyId":facultyId},
      {$pull:{"departmentList.$[e1].programs": {programId: programId}}},
      { 
        arrayFilters: [
          {"e1.departmentId": departmentId},
          { "e2.programId": programId}],
      }
      )
    result = await Faculty.findOne({"facultyId":facultyId})
    
  } catch (error) {
  console.log({success: false, error})
    
  }
  res.json({success: true, message: `Program with the ID ${programId} has been removed`, result})
}

// delete or staff
exports.removeDepartmentStaff = async (req,res,next) => {
  const {departmentId,staffId,facultyId} = req.query;
  let result
  try {
    
    await Faculty.findOneAndUpdate(
      {"facultyId":facultyId},
      {$pull:{"departmentList.$[e1].staffList": {staffId: staffId}}},
      { 
        arrayFilters: [
          {"e1.departmentId": departmentId},
          { "e2.staffId": staffId}],
      }
      )

    result = await Faculty.findOne({"facultyId":facultyId})
  } catch (error) {
  console.log({success: false, error})
    
  }
  res.json({success: true, message: `Staff with the ID ${staffId} has been removed`, result})
}


// delete Department
exports.removeDepartment = async (req,res,next) => {
  const {departmentId,facultyId} = req.query;
  let result
  try {
    const resultImage = await Faculty.findOne({"departmentList.departmentId":departmentId},{_id:0,departmentList:1})
    const resultImageFilter = resultImage.departmentList.filter((dpt)=>{
      return dpt.departmentId == departmentId
    })    
    
    console.log(resultImageFilter)
    // delete hod image from server
    if(resultImageFilter[0].hod.image != null){
      // console.log('222222','hshsisi')
      
      
        const imageName = resultImageFilter[0].hod.image.split('/').splice(7)
        console.log('-----------------',imageName)

           cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
          {
            invalidate: true,
              resource_type: "raw"
          }, 
            function(error,result) {
              // console.log('33333333',result, error)
            });  
    }

    // delete department image from server
    if(resultImageFilter[0].image != null){
      // console.log('222222','hshsisi')
      
      
        const imageName = resultImageFilter[0].image.split('/').splice(7)
        console.log('-----------------',imageName)

           cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
          {
            invalidate: true,
              resource_type: "raw"
          }, 
            function(error,result) {
              // console.log('33333333',result, error)
            });  
    }


    // console.log(result)
    await Faculty.findOneAndUpdate({"facultyId":facultyId},{$pull:{"departmentList":{"departmentId":departmentId}}})
    result = await Faculty.findOne({"facultyId":facultyId})
    
  } catch (error) {
  console.log({success: false, error})
    
  }
  res.json({success: true, message: `Department with the ID ${departmentId} has been removed`, result})
}

