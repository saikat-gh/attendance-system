var express = require('express');
var router = express.Router();
const multer = require('multer')
const path = require('path');
const geolib = require('geolib');
require("dotenv").config();
const { Pool } = require('pg');


// PostgreSQL connection configuration
const pool = new Pool({
  user: process.env.PGUser,
  host: process.env.PGHost,
  database: process.env.PGDatabase,
  password: process.env.PGPassword,
  port: process.env.PGPort,
  logging: true
});

// Set up multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'uploads/'); // Save images in the 'uploads' folder
  },
  filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)+".jpg"); // Unique file names
  }
});

const upload = multer({ storage: storage });

/* Toggle between adding and removing the "responsive" class to topnav when the user clicks on the icon */
function myFunction() {
    var x = document.getElementById("myTopnav");
    if (x.className === "topnav") {
      x.className += " responsive";
    } else {
      x.className = "topnav";
    }
  }

const os = require('os');
var glbLocaCode;
var glbLocaName;
//var MacId
var glbUserName;
var glbUserType;

// const networkInterfaces = os.networkInterfaces();
// for (let interface in networkInterfaces) {
//   MacId = networkInterfaces[interface][0].mac;
//   break;
// };

/* GET Login/Home page. */
router.get('/', async(req, res) => {
  const client = await pool.connect();
  try {
   // const locationResult = await client.query('SELECT id, location_name FROM location_master where LOWER(macid) = LOWER($1)', [MacId] );
   // const locations = locationResult.rows;
   // glbLocaCode = 11  // locations[0].id;
   // glbLocaName = "ISRO"  //locations[0].location_name;

    const userResult = await client.query('SELECT * FROM user_master order by username');
    const users = userResult.rows;

    res.render('login', { users });
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).send('Error fetching Locations');
  } finally {
    client.release();
  }
});

// Route fetch latitude and longitude from Location Master
router.get('/get-location/:id', async (req, res) => {
  const locationId = req.params.id; // Get the location ID from the request
  try {
      const query = `SELECT lat, long FROM location_master WHERE id = $1`;
      const result = await pool.query(query, [locationId]);

      if (result.rows.length > 0) {
          const { lat, long } = result.rows[0];
          res.json({ success: true, latitude: lat, longitude: long });
      } else {
          res.status(404).json({ success: false, message: 'Location not found.' });
      }
  } catch (error) {
      console.error('Error fetching location:', error);
      res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Route to handle Attendance Entry Employee Selection
router.get('/attendance/:key', async (req, res) => {
  const locationId = req.params.key;
  const client = await pool.connect();
  try {
    const result1 = await client.query('SELECT location_name from location_master where id = $1', [locationId]);
    const location_name = result1.rows;
    const result2 = await client.query('SELECT id, fname, lname, fotourl FROM employee_master where location_id = $1 order by fname, lname', [locationId]);
    const employees = result2.rows;
    res.render('attendance_list', { employees, locationId, location_name });
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).send('Error fetching Employees');
  } finally {
    client.release();
  }
});

// Route to handle Attendance Entry
router.get('/attendance-submit/:key', async(req, res) => {
  const locationId = req.params.id;
  console.log(`From Backend Route - Editing location ${locationId}`);
  // Fetch location details from the database based on locationId
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM location_master WHERE id = $1', [locationId]);
    console.log(result.rows);
    const locations = result.rows;
    res.render('location-edit', { locations, glbUserName, glbLocaName  });
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).send('Error fetching Locations');
  } finally {
    client.release();
  }
});


// Route From Attendance_List.EJS to capture Attendance
router.get('/attendance-capture', async (req, res) => {
  // Extract data from query parameters
  const empId = req.query.empId; // Employee ID
  const empName = JSON.parse(decodeURIComponent(req.query.empName)); // Row Data (parsed from JSON)
  const location = req.query.location; // Location Name
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT employee_master.fotourl, employee_master.location_id, location_master.lat, location_master.long FROM employee_master, location_master where employee_master.id = $1 and location_master.id = employee_master.location_id', [empId] );
    const otherData = result.rows;
    res.render('attendance-capture', {empId, empName, location, otherData });
} catch (err) {
    console.error('Error executing query', err);
    res.status(500).send('Error fetching Other Data from Employees and Location');
} finally {
    client.release();
}
});

router.post('/compare-face', upload.single('photo'), async (req, res) => {
  try {
      if (!req.file) {
          return res.status(400).json({ match: false, error: 'No photo provided' });
      }

      const capturedPhotoUrl = req.file.path;
      const empid = req.body.empid;
      console.log(`Processing face comparison for employee ID: ${empid}`);
      console.log(`Captured photo path: ${capturedPhotoUrl}`);

      // Get the reference image URL from the database
      const query = 'SELECT fotourl FROM employee_master WHERE id = $1';
      console.log(`Fetching reference image for employee ${empid} from database`);
      const result = await pool.query(query, [empid]);
      
      if (result.rows.length === 0) {
          console.log(`No employee found with ID: ${empid}`);
          return res.status(404).json({ match: false, error: 'Employee not found' });
      }

      let referenceImageUrl = result.rows[0].fotourl;
       referenceImageUrl = referenceImageUrl.substring(1)
      console.log(`Reference image URL: ${referenceImageUrl}`);
      
      // Use your existing face comparison function
      const { compareFacesPython } = require('../face-comparison/faceComparisonPython');
      console.log('Starting face comparison...');
      const similarityScore = await compareFacesPython(capturedPhotoUrl, referenceImageUrl);
      console.log(`Face comparison complete. Similarity score: ${similarityScore}`);
      
      // Define a threshold for matching
      const threshold = 0.5; // Adjust this value based on your needs
      console.log(`Checking if similarity score ${similarityScore} meets threshold ${threshold}`);
      
      const isMatch = similarityScore >= threshold;
      console.log(`Face comparison result: ${isMatch ? 'Match' : 'No match'}`);
      
      res.json({ 
          match: isMatch,
          score: similarityScore 
      });

  } catch (error) {
      console.error('Error in face comparison:', error);
      res.status(500).json({ match: false, error: 'Internal server error' });
  }
});

// Route to save Attendance Data
router.post('/submit-attendance', upload.single('photo'), async (req, res) => {
  try {
      console.log(`Inside Submit attendance`) 
      const { date, time, empid, latitude, longitude, location_id } = req.body;
      const photoUrl = req.file ? `/uploads/${req.file.filename}`+ 'jpg' : null;
      console.log(`Photo url prepared`)
      // Get the location coordinates from location_master
      const locationQuery = 'SELECT lat, long FROM location_master WHERE id = $1';
      const locationResult = await pool.query(locationQuery, [location_id]);
      console.log(`Location fetched`)
      if (locationResult.rows.length === 0) {
          console.log(`No location found ....returning error`)
          return res.status(400).json({ error: 'Invalid location ID' });
      }

      const knownLocation = {
          latitude: parseFloat(locationResult.rows[0].lat),
          longitude: parseFloat(locationResult.rows[0].long),
      };

      const userLocation = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };

      // Check if the user is within 5 meters
      const distance = geolib.getDistance(userLocation, knownLocation);
      console.log(`Distance from base location calculated: ${distance}`)
      if (distance > 5) {
          console.log(`Distance not within range`)
          return res.status(400).json({ error: 'You are not within the required radius' });
      }

      // // code for image comparison
      // // const frame = cv.imread('photoUrl'); 
      // // const referenceImage = cv.imread('/uploads/test.jpg')
      // const { compareFacesPython } = require('../face-comparison/faceComparisonPython');
      // let similarityScore = await compareFacesPython(photoUrl, '/uploads/test.jpg');
      // console.log(`Similarity score : ${similarityScore}`);

      // Check the count of attendance records for the same empid and date
      const countQuery = `
      SELECT COUNT(*) as count 
      FROM attendance 
      WHERE empid = $1 AND date = $2
      `;
      const countResult = await pool.query(countQuery, [empid, date]);
      const count = parseInt(countResult.rows[0].count, 10);
      console.log(`Attendance counnt fetched from database`)

      // Determine the value of inout field
      const inout = (count % 2 === 0) ? 'IN' : 'OUT';

      // Save attendance data
      const insertQuery = `
          INSERT INTO attendance (date, time, empid, lat, long, location_id, fotourl, inout)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      await pool.query(insertQuery, [date, time, empid, latitude, longitude, location_id, photoUrl, inout]);
      console.log(`Attendance saved to database`)
      // Redirect if the request expects a redirect
        if (req.headers.accept.includes('text/html')) {
            return res.redirect(`/attendance/${location_id}`);
        }

        // Send JSON response if requested via JavaScript
        res.json({ success: true, redirectUrl: `/attendance/${location_id}` });

      // Redirect to /attendance/:key with the location_id
      //res.redirect(/attendance/${location_id});
      //res.status(200).json({ message: 'Message from backend - Attendance submitted successfully' });

  } catch (error) {
      console.error('Error saving attendance:', error);
      res.status(500).json({ error: 'Message from backend - An error occurred while saving attendance' });
  }
});
// Route to fetch latitude and longitude for a location_id
router.get('/get-location/:id', async (req, res) => {
  const locationId = req.params.id;
  const client = await pool.connect();
  try {
      const result = await client.query('SELECT lat, long FROM location_master WHERE id = $1',[locationId]);
      res.send(result.rows);
      if (result.rows.length > 0) {
          res.json(result.rows[0]);
      } else {
          res.status(404).json({ error: 'Location not found' });
      }
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
  }
});

// Route to handle employee
router.get('/employee', async (req, res) => {
  if (glbUserType === 'admin') {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM employee_master order by fname, lname');
        const employees = result.rows;
        res.render('employee_list', { employees, glbUserName, glbLocaName, glbLocaCode, glbUserType });
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).send('Error fetching Employees');
    } finally {
        client.release();
    }
  } else {
      const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM employee_master where location_id = $1 order by fname, lname', [glbLocaCode]);
      const employees = result.rows;
      res.render('employee_list', { employees, glbUserName, glbLocaName, glbLocaCode, glbUserType });
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).send('Error fetching Employees');
    } finally {
        client.release();
    }
  }
});

//  GET Route to handle Employee Addition
router.get('/employee-add', async(req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM location_master order by location_name');
    const locations = result.rows;
    res.render("employee-add",  { locations, glbUserName, glbLocaName, glbLocaCode });
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).send('Error fetching Employees');
  } finally {
    client.release();
  }
});

// POST route to handle Employee Add form submission
router.post('/employee-add', upload.single('image'), async(req, res) => {
  const client = await pool.connect();
  const { location_name, fname, lname, addr1, addr2, city, state, pincode, mobile, email, esino, uanno } = req.body;

   let imageUrl = null;
   if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`; // Construct the image URL
  }
  // Query to get Location ID from Location_Master
  const result = await client.query('SELECT id FROM location_master WHERE location_name = $1', [location_name]);
  const location = result.rows[0]; 
  // Insert data into the database 
  const query = `INSERT INTO employee_master (fname, lname, addr1, addr2, city, state, pincode, mobile, email, esino, uanno, fotourl, location_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`;
  const values = [fname, lname, addr1, addr2, city, state, pincode, mobile, email, esino, uanno, imageUrl, location.id];
  client.query(query, values, (err, result) => {
      if (err) {
          console.error('Error inserting data:', err);
          res.status(500).send('Error saving Employee Data');
      } else {
        console.log("From POST Route - Redirecting to Employee Add Form");
        res.render("employee-add", { glbUserName, glbLocaName, glbLocaCode });
      }
  });
});

// Route to handle the Employee Edit request
router.get('/employee-edit', async(req, res) => {
  const empId = req.query.id;
    // Fetch location details from the database based on locationId
  const client = await pool.connect();
  try {
    const lresult = await client.query('SELECT * FROM location_master order by location_name');
    const locations = lresult.rows;

    const eresult = await client.query('SELECT employee_master.*, location_master.location_name FROM employee_master, location_master WHERE employee_master.id = $1 and employee_master.location_id = location_master.id', [empId]);
    const employees = eresult.rows;

    res.render('employee-edit', { employees,locations, glbUserName, glbLocaName  });
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).send('Error fetching Locations');
  } finally {
    client.release();
  }
});

router.put('/employee-update', upload.single('image'), async (req, res) => {
  const empId = req.query.id;
  const { fname, lname, addr1, addr2, city, state, pincode, mobile, email, esino, uanno, location_name } = req.body;
  const imageFile = req.file; // Uploaded image file

  try {
      // Update database with new data
      const query = `
          UPDATE employee_master
          SET fname = $1, lname = $2, addr1 = $3, addr2 = $4, city = $5, state = $6,
              pincode = $7, mobile = $8, email = $9, esino = $10, uanno = $11,
              location_id = (SELECT id FROM location_master WHERE location_name = $12),
              fotourl = $13
          WHERE id = $14
      `;
      const values = [
          fname, lname, addr1, addr2, city, state, pincode, mobile, email,
          esino, uanno, location_name, imageFile ? `/uploads/${imageFile.filename}` : null, empId
      ];
      await pool.query(query, values);

      res.status(200).json({ message: 'Employee updated successfully' });
  } catch (error) {
      console.error('Error updating employee:', error);
      res.status(500).json({ message: 'Failed to update employee' });
  }
});

// Route to handle the Location Delete request
router.delete('/employee-delete', (req, res) => {
  const empId = req.query.id;
  // Perform delete operation in the database
  pool.query('DELETE FROM employee_master WHERE id = $1', [empId], (err, result) => {
      if (err) {
          console.error(err);
          return res.status(500).send('Error deleting Employee.');
      }
      res.status(200).send('Employee deleted successfully.');
  });
});

// POST Route to handle Login Form submission
router.post('/login', async (req, res) => {
  const { username, password } = req.body; // Get username and password from the form
  const client = await pool.connect();
  try {
    // Query to get user information by username
    const userResult = await client.query('SELECT userid, username, userpwd, usertype, userlocation, location_master.location_name FROM user_master, location_master WHERE user_master.username = $1 and user_master.userlocation = location_master.id', [username]);
// Check if user exists
    if (userResult.rows.length > 0) {
      const uname = userResult.rows[0]; 

      if (password === uname.userpwd) {
        // Password matches
/*
        req.session.uname = {
          id: uname.userid,`
          username: uname.username,
          usertype: uname.usertype
        };
*/
        // Redirect to menu page
        glbUserName = uname.username
        glbLocaCode = uname.userlocation
        glbLocaName = uname.location_name
        glbUserType = uname.usertype
        res.redirect('/navbar');
      } else {
        // Password is incorrect
        res.status(401).send('Invalid password');
      }
    } else {
      // User does not exist
      res.status(401).send('Invalid username');
    }
  } catch (err) {
    console.error('Error during authentication', err);
    res.status(500).send('Internal Server Error');
  } finally {
    client.release();
  }
});

router.get('/navbar', (req, res) => {
  res.render('menu', { glbUserName, glbLocaName });
});

// Route to list all Locations
router.get('/location', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM location_master order by location_name');
//    console.log(result.rows);
    const locations = result.rows;
    res.render('location_list', { locations, glbUserName, glbLocaName, glbUserType });
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).send('Error fetching Locations');
  } finally {
    client.release();
  }
});


// Route to handle Location Add Form Display request
router.get('/location-add', (req, res) => {
  res.render("location-add", { glbUserName, glbLocaName  });
});

// Route to handle Location Add request
router.post('/location-add', async (req, res) => {
  const client = await pool.connect();
  try {
    console.log(req.body)
    const { location_name, address1, address2, address3, abbr, lat, long } = req.body;
      // Insert data into the database
      const result = await client.query('INSERT INTO location_master (location_name, location_addr1, location_addr2, location_addr3, abbr, lat, long) VALUES ($1, $2, $3, $4, $5, $6, $7)', [location_name, address1, address2, address3, abbr, lat, long]);
      res.render("location-add", { glbUserName, glbLocaName  });
  } catch (error) {
      console.error('Error inserting data:', error);
      res.status(500).send('Internal Server Error');
  }
});

// Route to handle the Location Edit request
router.get('/location-edit', async(req, res) => {
  const locationId = req.query.id;
  console.log(`From Backend Route - Editing location ${locationId}`);
  // Fetch location details from the database based on locationId
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM location_master WHERE id = $1', [locationId]);
    console.log(result.rows);
    const locations = result.rows;
    res.render('location-edit', { locations, glbUserName, glbLocaName  });
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).send('Error fetching Locations');
  } finally {
    client.release();
  }
});

// Route to handle the Location Update request
router.put('/location-update', (req, res) => {
  const locationId = req.query.id;
  if (!locationId) {
    return res.status(400).send('Location ID is required.');
  }
  const { location_name, address1, address2, address3, abbr, lat, long } = req.body;
  if (!location_name || !address1 || !address2 || !address3) {
    return res.status(400).send('All address fields and name are required.');
  }
  console.log("Inside Location update Route");
  console.log(req.body);
  const sql = `
    UPDATE location_master 
    SET 
      location_name = $1, 
      location_addr1 = $2, 
      location_addr2 = $3, 
      location_addr3 = $4, 
      abbr = $5,
      lat = $6,
      long = $7 
    WHERE id = $8
  `;
  console.log(sql);
  pool.query(sql, [location_name, address1, address2, address3, abbr, lat, long, locationId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Error updating location.');
    }
    if (result.rowCount === 0) {
      return res.status(404).send('Location not found.');
    }
    res.status(200).send('Location updated successfully.');
  });
});

// Route to handle the Location Delete request
router.delete('/location-delete', (req, res) => {
  const locationId = req.query.id;
  console.log("Inside Delete Route");
  // Perform delete operation in the database
  pool.query('DELETE FROM location_master WHERE id = $1', [locationId], (err, result) => {
      if (err) {
          console.error(err);
          return res.status(500).send('Error deleting location.');
      }
      res.status(200).send('Location deleted successfully.');
  });
});

router.get('/users-add', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM location_master order by location_name');
    const locations = result.rows;
    res.render("users-add", { glbUserName, glbLocaName, locations });
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).send('Error fetching Locations');
  } finally {
    client.release();
  }
});

router.get("/login" , (req, res) => {
  res.render("login");
});

router.get("/users", async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT userid, username, userpwd, usertype, location_name \
     FROM user_master, location_master where user_master.userlocation = location_master.id order by username');
    const users = result.rows;
    res.render('users_list', { users , glbUserName, glbLocaName  });
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).send('Error fetching Users');
  } finally {
    client.release();
  }
})

router.get("/rptDatewiseAttendance" , (req, res) => {
  res.render("rpt-datewise-attendance",{ glbUserType, glbUserName, glbLocaName });
});
router.get('/generate-report', async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Invalid date range.' });
  }

  // const query = `
  //     SELECT 
  //         a.date,
  //         CONCAT(e.fname, ' ', e.lname) AS name,
  //         a.fotourl,
  //         MIN(CASE WHEN a.inout = 'IN' THEN a.time END) AS inTime,
  //         MAX(CASE WHEN a.inout = 'OUT' THEN a.time END) AS outTime
  //     FROM 
  //         attendance a
  //     INNER JOIN 
  //         employee_master e 
  //     ON 
  //         a.empid = e.id
  //     WHERE 
  //         a.date BETWEEN $1 AND $2
  //     GROUP BY 
  //         a.date, a.empid, e.fname, e.lname, a.fotourl
  //     ORDER BY 
  //         a.date, e.fname, e.lname;
  // `;
  const query = `
    SELECT 
    date,
    CONCAT(e.fname, ' ', e.lname) AS name,
    e.fotourl,
    MIN(CASE WHEN InOut = 'IN' THEN Time END) AS "InTime",
    MAX(CASE WHEN InOut = 'OUT' THEN Time END) AS "OutTime"
    FROM attendance a, employee_master e
    where a.empid = e.id
    and a.date BETWEEN $1 AND $2
    GROUP BY Date, EmpId, e.fotourl, e.fname, e.lname
    ORDER BY Date, e.fname, e.lname;
    `;
  const client = await pool.connect();
  try {
      const result = await client.query(query, [startDate, endDate]);
      console.log(result);
      const report = result.rows.map(row => ({
          date: row.date,
          name: row.name,
          fotourl: row.fotourl || '/path/to/default/image.jpg',
          inTime: row.InTime || 'N/A',
          outTime: row.OutTime || 'N/A',
      }));
      console.log(report);
      res.render('scr-datewise-attendance', { startDate, endDate, glbLocaName, report });
//      res.json({ success: true, report });
  } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ success: false, message: 'Error generating report.' });
  } finally {
      client.release();
  }
});

module.exports = router;
