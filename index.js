const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
mongoose.connect('mongodb://localhost:27017/admin_db');
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
app.set('views', path.join(__dirname, 'views'));
// app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.json());
// Define the User model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  branch: { type: String, required: true },
  batch: { type: String, required: true },
  // strongSubjects: { type: [String], default: [] },
  // sportsStrengths: { type: [String], default: [] },
  strongSubjects: [
    {
      name: { type: String, required: true },
      subperc: { type: Number, required: true },
    },
  ],
  sportsStrengths: [
    {
      name: { type: String, required: true },
      sportper: { type: Number, required: true },
    },
  ],
  certificates: { type: [String],default: [] },
});
const Student = mongoose.model('Student', studentSchema);
// Define the Admin model
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const Admin = mongoose.model('Admin', adminSchema);

// const feedbackSchema = new mongoose.Schema({
//   studentName: {
//     type: String,
//     required: true,
//   },
//   feedbackText: {
//     type: String,
//     required: true,
//   },
//   dateSubmitted: {
//     type: Date,
//     default: Date.now,
//   },
// });
const feedbackSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255, // Adjust maximum length as needed
  },
  feedbackText: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000, // Adjust maximum length as needed
  },
  dateSubmitted: {
    type: Date,
    default: Date.now,
  },
});
const Feedback = mongoose.model('Feedback', feedbackSchema);


const ActivitySchema = new mongoose.Schema({
  name: {
      type: String,
      required: true
  },
  description: {
      type: String,
      required: true
  }
});

const Activity = mongoose.model('Activity', ActivitySchema);

module.exports = {Feedback,Activity};

// Function to create an admin if one doesn't exist
async function createAdminIfNeeded() {
  const adminUsername = 'sai';
  const adminPassword = 'sai'; // You should choose a more secure password

  try {
    const existingAdmin = await Admin.findOne({ username: adminUsername });
    if (!existingAdmin) {
      // Hash the password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      // Create a new admin document with the hashed password
      const newAdmin = new Admin({ username: adminUsername, password: hashedPassword });
      await newAdmin.save();
      console.log('Admin created');
    } else {
      console.log('Admin already exists');
    }
  } catch (error) {
    console.error('Error creating admin:', error);
    // Handle potential errors during admin creation (e.g., database errors)
  }
}

// Call the function when the server starts
createAdminIfNeeded().catch(console.error); // Catch any errors


// ... other routes (including app.get('/dashboard'), app.post('/register'), etc.)

app.post('/adminlogin', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }

  try {
    // Check if the user exists in the database
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(404).send('User not found');
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).send('Invalid password');
    }

    // Password is valid, user is authenticated
    const students = await Student.find();
    const feedbacks = await Feedback.find({});
    const activities = await Activity.find({}); // Fetch the activities
    res.render('admindashboard', { students, feedbacks, activities });
    console.log(feedbacks); 
    // res.render('admindashboard', { students, feedbacks });
    // res.render('admindashboard', { students });

  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).send('Internal Server Error'); // Send a more informative error message if possible
  }
});
app.post('/activities', async (req, res) => {
  try {
      const activity = new Activity({
          name: req.body.activityName,
          description: req.body.activityDescription
      });
      await activity.save();
      res.redirect('/admindashboard');
  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
});
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.delete('/feedbacks/:id', async (req, res) => {
  const { id } = req.params;

  try {
      // Find the feedback by ID and delete it
      await Feedback.findByIdAndDelete(id);

      // Redirect to a different route or send a success response
      res.redirect('/admindashboard'); // Redirect to a feedbacks listing page, for example
  } catch (error) {
      console.error('Error deleting feedback:', error);
      res.status(500).send('Internal Server Error');
  }
});

// app.delete('/feedbacks/:id', async (req, res) => {
//     try {
//         await Feedback.findByIdAndDelete(req.params.id);
//         const activities = await Activity.find();
//         const students = await Student.find(); // Fetch the students data

//         // Render the admin dashboard view with the students and activities data
//         res.render('admindashboard', { students, activities });
//         // res.redirect('/admindashboard');
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Server Error');
//     }
// });
app.get('/admindashboard', async (req, res) => {
    try {
        const students = await Student.find();
        const feedbacks = await Feedback.find({});
        // const activities = await Activity.find();
        const activitiesData = await Activity.find();
        // console.log(activities);  // Fetch the activities
        res.render('admindashboard', { students,feedbacks,activities:activitiesData});
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
app.delete('/activities/:id', async (req, res) => {
  const activityId = req.params.id;

  try {
      // Find the activity by ID and delete it
      await Activity.findByIdAndDelete(activityId);
      res.redirect('/admindashboard'); // Redirect to the admin dashboard or any other desired page
  } catch (error) {
      console.error('Error deleting activity:', error);
      res.status(500).send('Internal Server Error');
  }
});
app.get('/activities', async (req, res) => {
  try {
      // Query the activities collection to retrieve all activities
    
      const activities = await Activity.find();
      const students = await Student.find(); // Fetch the students from the database

      // Render the activities.ejs template and pass the activities and students data to it
      res.render('admindashboard', { activities, students }); // Pass the students data to the view
  } catch (error) {
      console.error('Error retrieving activities:', error);
      res.status(500).send('Internal Server Error');
  }
});



app.post('/logout', (req, res) => {
    
  res.redirect('/');
});










app.get('/dashboard',async (req, res) => {
  try {
    // const student = await Student.findOne({});
    const activitiesData = await Activity.find();
    console.log(activitiesData); 
    // Render the dashboard template with activities data
    // res.render('dashboard', { student, activities: activitiesData });
    res.render('dashboard', { activities: activitiesData });
    console.log(activitiesData); // log activities to the console
} catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
}
});













// Rest of your code...
app.post('/addstudent', async (req, res) => {

  const { name, age, branch, batch } = req.body;

  if (!name || !age || !branch || !batch) {
    return res.status(400).send('All student details are required');
  }

  try {
    // Create a new student and save it to the database
    const student = new Student({ name, age, branch, batch,strongSubjects: [],
      sportsStrengths: [], });
    await student.save();

    res.status(201).send('Student added successfully');
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/register', async (req, res) => {
  try {
    const { username, password, age, branch, batch } = req.body;
    // Check if the username already exists in the database
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send('Username already exists');
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create a new user document with the hashed password
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    // Create a new student document with the same name as the username
    const newStudent = new Student({ name: username, age, branch, batch });
    await newStudent.save();

    res.redirect('/'); // Redirect to homepage or login page
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/',(req,res)=>{
    res.render('homepage');
})
app.get('/studentdashboard.ejs',(req,res)=>{
    res.render('studentdashboard.ejs');
})

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }

  try {
    // Check if the user exists in the database
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send('Invalid password');
    }

    // Password is valid, user is authenticated
    // Retrieve student data based on the logged-in username
    const student = await Student.findOne({ name: { $regex: new RegExp(username, 'i') } });
    if (!student) {
      console.log(`Student not found for username: ${username}`);
      return res.status(404).send('Student not found');
    }
    const activitiesData = await Activity.find();
    // Render the dashboard page with the student details
    res.render('dashboard', { student ,activities:activitiesData});
  } 
  catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/students/:username', async (req, res) => {
  const { username } = req.params; // Get the username from the URL parameter

  try {
    const student = await Student.findOne({ name: { $regex: new RegExp(username, 'i') } });

    if (!student) {
      console.log(`Student not found for username: ${username}`);
      return res.status(404).send('Student not found');
    }

    // Render the student dashboard page with the student details
    const activitiesData = await Activity.find();
    res.render('dashboard', { student,activities:activitiesData });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});
// app.post('/addskills', async (req, res) => {
//   const { name, strongSubjects, sportsStrengths, certificatelink } = req.body;
//   console.log('Request body:', req.body);
//   console.log('Received data:', req.body); // Log the data received in the request
//   console.log('Received name:', name); //

//   try {
//     // Find the student by name
//     const student = await Student.findOne({ name });

//     if (!student) {
//       console.log(`Student not found for name: ${name}`);
//       return res.status(404).send('Student not found');
//     }

//     // Add the new strong subjects and sports strengths to the student's data
//     if (strongSubjects) {
//       student.strongSubjects.push(strongSubjects);
//     }
//     if (sportsStrengths) {
//       student.sportsStrengths.push(sportsStrengths);
//     }
//     if(certificatelink){
//     // Push the certificate link directly into the student's certificates array
//     // Use findOneAndUpdate to add the new certificate link to the certificates array
//     student.certificates.push(certificatelink);
//     }
//     // Save the updated student data
//     await student.save();

//     // Redirect or send a success response
//     // res.redirect('/dashboard'); 
//     res.render('dashboard', { student });
//   } catch (error) {
//     console.error('Error adding skills:', error);
//     res.status(500).send('Internal Server Error');
//   }
// // });
// app.post('/addskills', async (req, res) => {
//   const { name, strongSubjects, subperc,sportsStrengths,sportper, certificatelink } = req.body;

//   try {
//     // Find the student by name
//     const student = await Student.findOne({ name });

//     if (!student) {
//       console.log(`Student not found for name: ${name}`);
//       return res.status(404).send('Student not found');
//     }

//     // Add the new strong subjects and sports strengths to the student's data
//     // if (strongSubjects&&subperc) {
//     //   student.strongSubjects.push({ name: strongSubjects, subperc });
//     // }
//     // if (sportsStrengths&&sportper) {
//     //   student.sportsStrengths.push({ name: sportsStrengths, sportper });
//     // }
//     if (strongSubjects && subperc) {
//       if (!student.strongSubjects.some(subject => subject.name === strongSubjects)) {
//         student.strongSubjects.push({ name: strongSubjects, subperc });
//       }
//     }
//     if (sportsStrengths && sportper) {
//       if (!student.sportsStrengths.some(strength => strength.name === sportsStrengths)) {
//         student.sportsStrengths.push({ name: sportsStrengths, sportper });
//       }
//     }
//     if(certificatelink){
//       student.certificates = student.certificates.concat(certificatelink);
//     }

//     // Save the updated student data
//     await student.save();

//     // Fetch activities from the database
//     const activities = await Activity.find();

//     // Render the dashboard view with the student and activities data
//     res.render('dashboard', { student, activities });
//   } catch (error) {
//     console.error('Error adding skills:', error);
//     res.status(500).send('Internal Server Error');
//   }
// });

app.post('/addStrongSubject', async (req, res) => {
    try {
      console.log(req.body); 
        // Extract data from the request body
        const { studentName, name, subperc } = req.body;

        // Create a new strong subject object
        const newStrongSubject = { name, subperc };

        // Find the student by name and update the strongSubjects array
        const updatedStudent = await Student.findOneAndUpdate(
            { name: studentName }, // find document with this filter
            { $push: { strongSubjects: newStrongSubject } }, // update the document
            { new: true } // options: return the updated document
        );

        const activities = await Activity.find();
        console.log(updatedStudent);
        // Render the 'student' view and pass the updated student data and activities
        res.render('dashboard', { student: updatedStudent, activities });
    } catch (err) {
        console.error('Error adding strong subject:', err);
        res.status(500).send('Error adding strong subject');
    }
});
app.post('/addSportsStrength', async (req, res) => {
    try {
      console.log(req.body); 
      const { studentName, name, sportper } = req.body;

      // Create a new sports strength object
      const newSportsStrength = { name, sportper };

      // Find the student by name and update the sportsStrengths array
      const updatedStudent = await Student.findOneAndUpdate(
          { name: studentName }, // find a document with this filter
          { $push: { sportsStrengths: newSportsStrength } }, // update the document
          { new: true } // options: return the updated document
      );

      const activities = await Activity.find();
      console.log(updatedStudent);
      // Render the 'student' view and pass the updated student data and activities
      res.render('dashboard', { student: updatedStudent, activities });
    } catch (err) {
        console.error('Error adding sports strength:', err);
        res.status(500).send('Error adding sports strength');
    }
});
// app.post('/deleteSkill', async (req, res) => {
//     const {studentName, deleteField, deleteValue } = req.body;

//     // Find the student and remove the strong subject
//     const student = await Student.findOneAndUpdate(
//         { name: studentName}, // Replace 'studentName' with the actual student's name
//         { $pull: { [deleteField]: deleteValue } },
//         { new: true }
//     );

//     if (!student) {
//         console.log(`Student not found for name: studentName`);
//         return res.status(404).send('Student not found');
//     }

//     // Redirect or send a success response
//     res.render('dashboard',{student});
// // });
// app.post('/deleteSkill', async (req, res) => {
//     const {studentName, deleteField, deleteValue } = req.body;

//     // Find the student and remove the strong subject
//     const student = await Student.findOneAndUpdate(
//         { name: studentName},
//         { $pull: { [deleteField]: deleteValue } },
//         { new: true }
//     );

//     if (!student) {
//         console.log(`Student not found for name: ${studentName}`);
//         return res.status(404).send('Student not found');
//     }

//     // Fetch activities from the database
//     const activities = await Activity.find();

//     // Render the dashboard view with the student and activities data
//     res.render('dashboard', { student, activities });
// });
app.post('/deleteSkill', async (req, res) => {
    const {studentName, deleteField, deleteValue } = req.body;

    // Find the student
    const student = await Student.findOne({ name: studentName });

    if (!student) {
        console.log(`Student not found for name: ${studentName}`);
        return res.status(404).send('Student not found');
    }

    // Remove the strong subject and its corresponding percentage
    const index = student[deleteField].indexOf(deleteValue);
    if (index !== -1) {
        student[deleteField].splice(index, 1);
        if (deleteField === 'strongSubjects') {
            student.subperc.splice(index, 1);
        }
    }

    // Save the updated student
    await student.save();

    // Fetch activities from the database
    const activities = await Activity.find();

    // Render the dashboard view with the student and activities data
    res.render('dashboard', { student, activities });
});
// app.post('/deletesport', async (req, res) => {
//   const { studentName, deleteValue } = req.body;

//   try {
//     // Find the student
//     const student = await Student.findOne({ name: studentName });

//     if (!student) {
//       return res.status(404).send('Student not found');
//     }

//     // Remove the strong subject
//     const index = student.sportsStrengths.indexOf(deleteValue);
//     if (index !== -1) {
//       student.sportsStrengths.splice(index, 1);
//     }

//     // Save the updated student
//     await student.save();
//     const activities = await Activity.find();

//     res.render('dashboard',{student,activities});
//     // Redirect to the dashboard or render a success message
//     // res.redirect('/dashboard');
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server Error');
//   }
// });
app.post('/deletesport', async (req, res) => {
  const { studentName, deleteValue } = req.body;

  try {
    // Find the student
    const student = await Student.findOne({ name: studentName });

    if (!student) {
      return res.status(404).send('Student not found');
    }

    // Remove the sports strength and its corresponding percentage
    const index = student.sportsStrengths.indexOf(deleteValue);
    if (index !== -1) {
      student.sportsStrengths.splice(index, 1);
      student.sportperc.splice(index, 1);
    }

    // Save the updated student
    await student.save();
    const activities = await Activity.find();

    res.render('dashboard',{student,activities});
    // Redirect to the dashboard or render a success message
    // res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});
// app.post('/submitFeedback', async (req, res) => {
//   const { studentName, feedbackText } = req.body;

//   // Check if feedbackText is provided
//   if (!feedbackText) {
//     return res.status(400).send('Bad Request: feedbackText is required');
//   }

//   try {
//     const feedback = new Feedback({
//       studentName,
//       feedbackText,
//     });

//     await feedback.save();
//     const student = await Student.findOne({ name: studentName });
//     // res.status(201).send('Feedback submitted successfully!');
//     res.render('dashboard',{student});
//   } catch (error) {
//     console.error('Error submitting feedback:', error);
//     res.status(500).send('Internal Server Error');
//   }
// });

app.post('/submitFeedback', async (req, res) => {
  const { studentName, feedbackText } = req.body;

  // Check if feedbackText is provided
  if (!feedbackText) {
    return res.status(400).send('Bad Request: feedbackText is required');
  }

  try {
    const feedback = new Feedback({
      studentName,
      feedbackText,
    });

    await feedback.save();
    const student = await Student.findOne({ name: studentName });

    if (!student) {
      console.log(`Student not found for name: ${studentName}`);
      return res.status(404).send('Student not found');
    }

    // Fetch activities from the database
    const activities = await Activity.find();

    // Render the dashboard view with the student and activities data
    res.render('dashboard', { student, activities });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).send('Internal Server Error');
  }
});








// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
