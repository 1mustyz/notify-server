const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const DepartmentSchema = require('./department');

const FacultySchema = Schema({
    facultyId: {type: String, required: true, unique: [ true, 'Faculty ID already exist' ]},
    image: {type: String},
    facultyName: {type: String},
    facultyDescription: {type: String},
    shortNote: {type: String},
    dean: {type: Object},
    departmentList: [DepartmentSchema]
}, { timestamps: true });

const faculty = mongoose.model('faculty', FacultySchema)
module.exports = faculty;