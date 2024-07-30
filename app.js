// Import the Express.js framework
const express = require('express');
const mysql = require('mysql2');

// Import multer
const multer = require('multer');

// Create MySQL connection
const connection = mysql.createConnection({
    host: 'mysql-yl-miniproj.alwaysdata.net',
    user: '370876',
    password: '.HfQidziG6U4v3!',
    database: 'yl-miniproj_db'
});
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

//TODO: Include code for body-parser
const bP = require('body-parser');
// Create an instance of the Express application. This app variable will be used to define routes and configure the server.
const app = express();
app.use(express.static('public'));

//TODO: Include code for Middleware to parse request bodies
app.use(bP.urlencoded({extended:true}));

// Specify the port for the server to listen on
const PORT = process.env.PORT || 3000;

//TODO: Include code to set EJS as the view engine
app.set('view engine','ejs');

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/'); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });



// Routes for CRUD operations
// Route to retrieve and display all members
app.get('/', (req, res) => {
    res.render('index');
});

// Add a new member form
app.get('/signUp',(q, r)=>{
    r.render('signUp');
});

// Add a new member
app.post('/signUp', upload.single('image'), (req,res) => {
    // Extract product data from the request body
    const { memberName, contact, email, password } = req.body;
    let image;
    if (req.file) {
        image = req.file.filename; // Save only the filename
    } else {
        image = null;
    }

    const sql = 'INSERT INTO members (memberName, contact, email, password, image) VALUES (?,?,?,?,?)';
    // Insert the new product into the database
    connection.query(sql,[memberName,contact,email,password,image], (error,results) => {
        if (error) {
            console.error("Error adding member:", error);
            res.status(500).send('Error adding member');
        } else {
            res.redirect('/signUpConfirmation');
        }
    });
});

app.get('/signUpConfirmation', (q,r) => {
    connection.query('SELECT * FROM members', (error,results))
    if (error) throw error;
    r.render('signUpConfirm', {member:results});
});

// Login
app.get('/login',(q,r)=>{
    r.render('login');   
});


app.post('/login', (q,r) => {
    const { email,password } = q.body;
    connection.query('SELECT * FROM members WHERE email = ? AND password = ?', [email,password], (error,results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return r.status(500).send('Error Logging In');
        }

        if (results.length > 0) {
            member = results
            r.redirect('/dashboard') // Redirect to the dashboard
        } else {
            r.status(401).send('Invalid email or password');
        }

        
    });
});

app.get('/dashboard', (req,res) => {
    connection.query('SELECT * FROM members', (error,results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return r.status(500).send('Error retrieving member');
        }
        if (results.length > 0) {
            res.render('dashboard', {member:results});
        }
    });
});


// View all users that has created an account
app.get('/memberPage', (q, r) => {
    connection.query('SELECT * FROM members', (error,results) => {
        if (error) throw error;
        r.render('memberPage', { members: results });
    });
});

// Route to get a specific member by ID
app.get('/members/:id', (req,res) => {
    // Extracting the 'id' parameter from the request parameters and converting it to an integer
    const memberId = req.params.id;
    const sql = 'SELECT * FROM members WHERE memberId = ?';
    connection.query( sql , [memberId] , (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving product by ID');
        }
        // Checking if a member with the specified 'id' was found
        if (results.length > 0) {
            res.render('members', { members: results[0] });
        } else {
            res.status(404).send('Member not found');
        }
    });
});


// View following
app.get('/following',(q,r) => {
    connection.query('SELECT * FROM members', (error,results) => {
        if (error) throw error;
        r.render('following', {members:results});
    })
});


// Create Routine
app.get('/viewWorkout/create',(req,res) => {
    connection.query('SELECT * FROM exercises', (error,results) => {
        if (error) throw error;
        res.render('createRoutine', { exercises:results });
    });
});

app.post('/createRoutine', (req,res) => {
    const { routineName,exSelected } = req.body;
    if (!exSelected || exSelected.length === 0) {   // ChatGPT assisted this line
        return res.status(400).send('No exercises selected');
    }
    const exSelectedString = Array.isArray(exSelected) ? exSelected.join(',') : exSelected; // ChatGPT assisted this line
    const sql = 'INSERT INTO routines (routineName,exSelected) VALUES (?,?)';

    connection.query(sql,[routineName,exSelectedString], (error,results) => {
        if (error) {
            console.error("Error creating routine:", error);
            res.status(500).send('Error creating routine');
        } else {
            res.redirect('/showRoutine');
        }
    });
});

app.get('/showRoutine', (req,res) => {
    connection.query('SELECT * FROM exercises', (error, results1) => {
        if (error) {
            console.error("Error fetching exercises:", error);
            return res.status(500).send('Error fetching exercises');
        }

        connection.query('SELECT * FROM routines', (error, results2) => {
            if (error) {
                console.error("Error fetching routines:", error);
                return res.status(500).send('Error fetching routines');
            }

            res.render('showRoutine', { exercises: results1, routines: results2 });
        });
    });
});


// View Exercises
app.get('/workoutList', (req, res) => {
    connection.query('SELECT * FROM exercises', (error, results) => {
    if (error) throw error;
        res.render('workoutList', { exercises:results }); // Render HTML page with data
    });
});

app.get('/exercise/:id', (req,res) => {
    const exerciseId = req.params.id;
    const sql = 'SELECT * FROM exercises WHERE exerciseId = ?';
    connection.query( sql , [exerciseId] , (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving product by ID');
        }

        if (results.length > 0) {
            res.render('exercise', { exercise: results[0] });
        } else {
            res.status(404).send('Product not found');
        }
    });
});

// Update Member by Id
app.get('/members/:id/edit',(req,res) => {
    const memberId = req.params.id;
    const sql = 'SELECT * FROM members WHERE memberId = ?';
    // Fetch data from MySQL based on the member ID 
    connection.query( sql, [memberId], (error,results) => {
        if (error) {
            console.error('Database query error:',error.message);
            return res.status(500).send('Error updating Member');
        }
        // Check if any member with the given ID was found
        if (results.length > 0) {
            // Render HTML page with the member data
            res.render('editMember', { member:results[0] });
        } else {
            // If no member with the given ID was found, render a 404 page or handle it accordingly
            res.status(404).send('Member not found');
        }
    });
});

app.post('/members/:id/edit', upload.single('image'), (req,res) => {
    const memberId = req.params.id;
    // Extract member data from the request body
    const { name, contact, email } = req.body
    let image = req.body.currentImage; // Retreive current image filename
    if (req.file) { // if new image is uploaded
        image = req.file.filename; // set image to be new image filename
    }

    const sql = 'UPDATE members SET memberName = ? , contact = ? , email = ? , image =? WHERE memberId = ?';

    connection.query( sql, [name,contact,email,image,memberId], (error,results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error updating member:",error);
            res.status(500).send('Error updating member');
        } else {
            // Send a success response
            res.redirect('/memberPage');
        }
    });
});

// Delete member by memberId
app.get('/deleteMember/:memberId', (req,res) => {
    const memberId = req.params.id;
    connection.query('DELETE FROM members WHERE memberId = ?', [memberId], (error,results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send("Error deleting member")
        }
        res.redirect('/memberPage');
    });
});

// Update Exercise in Routine By Id
app.get('/updateExercise/:routineId/:exerciseId', (req,res) => {
    const routineId = req.params.routineId;
    const exerciseId = req.params.exerciseId;
    const routineSql = 'SELECT * FROM routines WHERE routineId = ?';

    connection.query(routineSql,[routineId], (routineError,routineResults) => {
        if (routineError) {
            console.error("Error fetching routine:",routineError);
            return res.status(500).send('Error fetching routine');
        }
        if (routineResults.length === 0) {
            return res.status(404).send('Routine not found'); 
        }
        const routine = routineResults[0];  // ChatGPT assisted most of this from here to....
        const exerciseSql = 'SELECT * FROM exercises';
        connection.query(exerciseSql, (exerciseError,exerciseResults) => {
            if (exerciseError) {
                console.error('Error fetching exercises:',exerciseError);
                return res.status(500).send('Error fetching exercises');
            }
            res.render('editExercise', {   
                routine: routine,
                exercises: exerciseResults,
                exerciseId: exerciseId      // here
            });
        });
    });
});

app.post('/updateExercise/:routineId/:exerciseId', (req,res) => {
    const routineId = req.params.routineId;
    const oldExerciseId = req.params.exerciseId;
    const newExerciseId = req.body.exSelected;

    // For debugging purposes
    console.log('routineId:',routineId);
    console.log('oldExerciseId:',oldExerciseId);
    console.log('newExerciseId:',newExerciseId);

    const selectSql = 'SELECT exSelected FROM routines WHERE routineId = ?';
    connection.query(selectSql, [routineId], (selectError, selectResults) => {
        if (selectError) {
            console.error('Error fetching routine:', selectError);
            return res.status(500).send('Error fetching routine');
        }
        if (selectResults.length === 0) {
            return res.status(404).send('Routine not found');
        }
        let exSelected = selectResults[0].exSelected;   // ChatGPT assisted from here to...
        let exSelectedArray = exSelected.split(',').map(id => id.trim());   
        const index = exSelectedArray.indexOf(oldExerciseId);   
        if (index !== -1) {
            exSelectedArray[index] = newExerciseId;     // here
        }
        // Join the array back into a string
        const newExSelected = exSelectedArray.join(',');
        const updateSql = 'UPDATE routines SET exSelected = ? WHERE routineId = ?';
        connection.query(updateSql, [newExSelected, routineId], (updateError, updateResults) => {
            if (updateError) {
                console.error('Error updating routine:', updateError);
                return res.status(500).send('Error updating routine');
            }
            res.redirect('/showRoutine');
        });
    });
});

// Delete entire Routine
app.get('/deleteRoutine/:routineId', (req,res) => {
    const routineId = req.params.routineId;
    connection.query('DELETE FROM routines WHERE routineId = ?', [routineId], (error,results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send("Error deleting routine")
        }
        res.redirect('/showRoutine');
    });
})


// Delete Exercise in Routine by Id
app.get('/deleteExercise/:routineId/:exerciseId', (req,res) => {
    const routineId = req.params.routineId;
    const exerciseId = req.params.exerciseId;
    const selectSql = 'SELECT exSelected FROM routines WHERE routineId = ?';
    connection.query( selectSql, [routineId], (error1,result1) => {
        if (error1) {
            // Handle any error that occurs during the database operation
            console.error('Error fetching routine:',error1);
            return res.status(500).send('Error fetching routine');
        } 
        if (result1.length === 0) {
            return res.status(404).send('Routine not found');
        }

        let exSelected = result1[0].exSelected;     // ChatGPT assisted this line and...
        let exSelectedArray = exSelected.split(',').map(id => id.trim());   // this line

        // Remove the exerciseId from the array
        exSelectedArray = exSelectedArray.filter(id => id !== exerciseId);

        // Join the array back into a string
        const newExSelected =exSelectedArray.join(',');

        // Update the routine with the new exSelected value
        const updateSql = 'UPDATE routines SET exSelected = ? WHERE routineId = ?';
        connection.query(updateSql, [newExSelected, routineId], (updateError, updateResult) => {
            if (updateError) {
                console.error('Error updating routine:',updateError);
                return res.status(500).send('Error updating routine');
            }

            res.redirect('/showRoutine');
        });
    });
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  // Log a message when the server is successfully started
  console.log(`Server is running at http://localhost:${PORT}`);
});
