const bcrypt = require('bcrypt'); // For password hashing if needed

router.post('/login', async (req, res) => {
  const { username, password } = req.body; // Get username and password from the form
  const client = await pool.connect();
  
  try {
    // Query to get user information by username
    const userResult = await client.query(
      'SELECT userid, username, userpwd, usertype FROM user_master WHERE username = $1',
      [username]
    );

    // Check if user exists
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];

      // Compare passwords (assuming passwords are hashed in the database)
      const passwordMatch = await bcrypt.compare(password, user.userpwd);

      if (passwordMatch) {
        // Password is correct - Load menu system
        // Optionally set up a session or JWT for authenticated user
        req.session.user = {
          id: user.userid,
          username: user.username,
          usertype: user.usertype
        };
        
        // Redirect to menu page
        res.redirect('/menu');
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
    res.status(500).send('Internal server error');
  } finally {
    client.release();
  }
});
