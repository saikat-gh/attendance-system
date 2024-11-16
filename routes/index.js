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
var MacId
var glbUserName;

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
    glbLocaCode = 11  // locations[0].id;
    glbLocaName = "ISRO"  //locations[0].location_name;

    const userResult = await client.query('SELECT * FROM user_master WHERE userlocation = $1', [glbLocaCode]);
    const users = userResult.rows;

    res.render('login', { glbLocaCode, glbLocaName, users });
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).send('Error fetching Locations');
  } finally {
    client.release();
  }
});

// POST route to handle Employee Add form submission
router.post('/employee-add', upload.single('image'), async(req, res) => {
  
  const client = await pool.connect();
  const { fname, lname, addr1, addr2, city, state, pincode, mobile, email, esino, uanno } = req.body;
//  const imageUrl = `/uploads/${req.file.filename}`; // Image path

   let imageUrl = null;
   if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`; // Construct the image URL
  }

  // Insert data into the database 
  const query = `INSERT INTO employee_master (fname, lname, addr1, addr2, city, state, pincode, mobile, email, esino, uanno, fotourl, location_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`;
  const values = [fname, lname, addr1, addr2, city, state, pincode, mobile, email, esino, uanno, imageUrl, glbLocaCode];
  
  client.query(query, values, (err, result) => {
      if (err) {
          console.error('Error inserting data:', err);
          res.status(500).send('Error saving Employee Data');
      } else {
          
          res.render('employee-add', { glbUserName, glbLocaName, glbLocaCode });
      }
  });
});

// Route to handle Attendance Entry
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

router.get('/attendance-submit', (req, res) => {
  const { key, cells } = req.query;
  if (!key || !cells) {
      return res.status(400).send("Invalid data provided.");
  }

  res.render('attendance-submit', { key, cells, glbLocaCode });
});


// Route to handle employee
router.get('/employee', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM employee_master where location_id = $1 order by fname, lname', [glbLocaCode]);
    const employees = result.rows;
    res.render('employee_list', { employees, glbUserName, glbLocaName, glbLocaCode });
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).send('Error fetching Employees');
  } finally {
    client.release();
  }
});

//  GET Route to handle Employee Addition
router.get('/employee-add', (req, res) => {
  res.render("employee-add",  { glbUserName, glbLocaName, glbLocaCode });
});

// POST Route to handle Login Form submission
router.post('/login', async (req, res) => {
  const { username, password } = req.body; // Get username and password from the form
  const client = await pool.connect();
  
  try {
    // Query to get user information by username
    const userResult = await client.query('SELECT userid, username, userpwd, usertype FROM user_master WHERE username = $1', [username]);

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
    console.log(result.rows);
    const locations = result.rows;
    res.render('location_list', { locations, glbUserName, glbLocaName  });
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).send('Error fetching Locations');
  } finally {
    client.release();
  }
});

// Route to list all Locations
// router.get('/location/search/:txt', async (req, res) => {
//   const client = await pool.connect();
//   try {
//     const result = await client.query('SELECT * FROM location_master where location_name like ":txt%" order by location_name');
//     const locations = result.rows;
//     res.render('location_list', { locations });
//   } catch (err) {
//     console.error('Error executing query', err);
//     res.status(500).send('Error fetching Locations');
//   } finally {
//     client.release();
//   }
// });

router.get('/searchLocations/:searchTxt', async (req, res) => {

  try {
      const searchTxt = req.query.searchTxt.toLowerCase();
      
      // Execute a query to fetch locations based on the search text
      const result = await client.query('SELECT * FROM location_master WHERE location_name ILIKE $1', [`%${searchTxt}%`]);
      // Send the fetched data as JSON
      res.json(result.rows);
    
  } catch (error) {
      console.error('Error searching locations:', error);
      res.status(500).json({ error: 'Internal Server Error' });
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
router.get('/location-edit/:id', async(req, res) => {
  const locationId = req.params.id;
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

// Route to handle the Location Delete request
router.delete('/location-delete/:id', (req, res) => {
  const locationId = req.params.id;
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
