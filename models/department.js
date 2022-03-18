const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DepartmentSchema = Schema({
    departmentId: {type: String},
    image: {type: String, default:null},
    departmentName: {type: String},
    vission: {type: String, default:null},
    mission: {type: String, default:null},
    hod: {type: Object, default:null},
    staffList: [{type: Object,default:null}],
    programs: [{type: Object,default:null}],
}, { timestamps: true });

module.exports = DepartmentSchema;