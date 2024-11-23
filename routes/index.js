var express = require('express');
var router = express.Router();
const multer = require('multer')
const path = require('path');

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
      cb(null, Date.now() + path.extname(file.originalname)); // Unique file names
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


// Route to handle Attendance Entry Employee Selection
router.get('/attendance', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM employee_master where location_id = $1 order by fname, lname', [glbLocaCode]);
    const employees = result.rows;
    res.render('attendance_list', { employees, glbUserName, glbLocaName, glbLocaCode });
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


router.get('/attendance-submit', (req, res) => {
  const { key, cells } = req.query;
  if (!key || !cells) {
      return res.status(400).send("Invalid data provided.");
  }
  res.render('attendance-submit', { key, cells, glbLocaCode });
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
console.log(query);
console.log(values);

      await pool.query(query, values);

      res.status(200).json({ message: 'Employee updated successfully' });
  } catch (error) {
      console.error('Error updating employee:', error);
      res.status(500).json({ message: 'Failed to update employee' });
  }
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
          id: uname.userid,
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
    res.render('location_list', { locations, glbUserName, glbLocaName  });
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
    const { location_name, address1, address2, address3, abbr } = req.body;
      // Insert data into the database
      const result = await client.query('INSERT INTO location_master (location_name, location_addr1, location_addr2, location_addr3, abbr) VALUES ($1, $2, $3, $4, $5)', [location_name, address1, address2, address3, abbr]);
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
  const { location_name, address1, address2, address3, abbr } = req.body;
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
      abbr = $5 
    WHERE id = $6
  `;
  console.log(sql);
  pool.query(sql, [location_name, address1, address2, address3, abbr, locationId], (err, result) => {
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

router.get('/users-add', (req, res) => {
  res.render("users-add", { glbUserName, glbLocaName  });
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

module.exports = router;
