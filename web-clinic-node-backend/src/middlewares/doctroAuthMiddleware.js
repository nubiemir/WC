const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Doctor = require('../models/Doctor');

module.exports = (req,res,next) => {
    try {
        const { authorization } = req.headers;
        
        if (!authorization) {
          throw new Error("You must Log in first");
        }
        const token = authorization.replace("Bearer ", "");

        if (!token) throw new Error('Not authenticated')
    
        jwt.verify(
          token,
          `${process.env.MY_SECRET_WEB_TOKEN_KEY}`,
          async (err, payload) => {
            if (err) {
              return res.send({
                success: false,
                error: "Invalid email or password",
              });
            }
            const { docId } = payload;
            const doctor = await Doctor.findById(docId);
            req.doctor = doctor;
            
            next();
          }
        );
      } catch (err) {
        console.log(err.message);
        const error = new Error(err.message);
        return next(error);
      }
}