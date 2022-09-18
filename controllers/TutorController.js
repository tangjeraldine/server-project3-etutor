const express = require("express");
const jwt = require("jsonwebtoken");
//test out middleware to see if we require bcrypt in the controller
const Classes = require("../models/Classes");
const Tutors = require("../models/Tutors");
const Tutees = require("../models/Tutees");
const TutorProfileValidation = require("../Validations/TutorProfileValidation");
const Users = require("../models/User");
const router = express.Router();

const SECRET = process.env.SECRET ?? "mysecret";

//* Middleware for validation
const validation = (schema) => async (req, res, next) => {
  const body = req.body;
  try {
    await schema.validate(body);
    next();
  } catch (error) {
    res.status(400).json(error);
  }
};

//userTypeIsTutor middleware
const userTypeIsTutor = async (req, res, next) => {
  const bearer = req.get("Authorization");
  const token = bearer.split(" ")[1];
  try {
    res.locals.payload = jwt.verify(token, SECRET);
    if (res.locals.payload.userTYPE === "Tutor") {
      // res.send(res.locals.payload);
      next();
    } else {
      res.status(401).send("You are not authorised to view this page.");
    }
  } catch (error) {
    res.status(401).send({ error });
  }
};

// Find all tutor
router.get("/", async (req, res) => {
  try {
    const allTutor = await Tutors.find();
    res.status(200).send(allTutor);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Filter tutors by subjects,classType and classLevel
// fix required
router.get("/search", async (req, res) => {
  let subjects = req.query.subjects;
  let classType = req.query.classType;
  let classLevel = req.query.classLevel;

  try {
    const filteredTutor = await Tutors.find({
      subjects: subjects,
      classType: classType,
      classLevel: classLevel,
    }).exec();

    res.status(200).send(filteredTutor);
  } catch (error) {
    console.log(error);
  }
});

// Get to tutors page where user can access their own information
router.get("/", userTypeIsTutor, async (req, res) => {
  try {
    //! Change to find that one tutor's class info by username
    // const payload = req.headers.authorization;
    const payload = res.locals.payload;
    const currentTutor = await Tutors.find({ username: payload.username });
    res.status(200).send(currentTutor);
    //! Show that one tutor's calendar information
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post(
  "/profile-signup",
  validation(TutorProfileValidation),
  async (req, res) => {
    const newTutor = req.body;
    const newSignUpEmail = newTutor.email;
    const thisNewEmail = await Tutors.findOne({ email: newSignUpEmail });
    //!Q: this means only email is unique right? then phone number we just leave it as not unique? as of now i just set the front end to detect only email as unique
    //another Q: this means the email is unique only within tutors? bc if tutee creates with same email we wont know cz we r looking thru db of tutor only
    //possible solution: email is part of generic user sign up
    console.log(thisNewEmail, newSignUpEmail);
    if (thisNewEmail === null) {
      Tutors.create(newTutor, (error, tutor) => {
        if (error) {
          console.log(error);
          res.status(500).json({ error: "Tutor profile unable to be set up." });
        } else {
          res.status(200).json(tutor);
        }
      });
    } else if (thisNewEmail.email === newSignUpEmail) {
      res.status(400).send({ error: "This email address is already in use." });
    }
  }
);

// router.put("/editprofile/:id", async (req, res) => {
//   Users[req.params.id] = req.body;
//   console.log(Users[req.params.id]);
// const findThisTutor = await Tutors.findOne({username: })
// });

module.exports = router;
