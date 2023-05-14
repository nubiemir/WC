const mongoose = require('mongoose');

const IdentifierSchema = new mongoose.Schema({
    identifier:{
        type:String,
        required:true,
        trim:true
    },
    name:{
        type:String,
        required:true,
        trim:true
    }
})


module.exports = mongoose.model('doctor_identifier',IdentifierSchema);