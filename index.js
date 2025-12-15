const express = require('express');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');
const app = express();
const port = process.env.PORT || 5000;
const path = require('path');
const methodOverride = require('method-override');

app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database configuration with sensible defaults for Kubernetes deployment
const DB_CONFIG = {
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'crud_user',
  password: process.env.DB_PASSWORD || 'crud_pass',
  database: process.env.DB_NAME || 'crud_db',
  port: Number(process.env.DB_PORT || 3306)
};
const MAX_DB_RETRIES = Number(process.env.DB_RETRIES || 10);
const DB_RETRY_DELAY_MS = Number(process.env.DB_RETRY_DELAY_MS || 3000);

let pool;

async function initDb() {
  pool = mysql.createPool({
    ...DB_CONFIG,
    connectionLimit: 10,
    waitForConnections: true
  });

  // Wait for the database to be reachable (helps during fresh pod starts)
  for (let attempt = 1; attempt <= MAX_DB_RETRIES; attempt++) {
    try {
      await pool.query('SELECT 1');
      break;
    } catch (err) {
      if (attempt === MAX_DB_RETRIES) {
        throw err;
      }
      console.warn(`DB not ready (attempt ${attempt}/${MAX_DB_RETRIES}). Retrying in ${DB_RETRY_DELAY_MS}ms...`);
      await new Promise(resolve => setTimeout(resolve, DB_RETRY_DELAY_MS));
    }
  }

  // Ensure posts table exists; seed initial data if empty
  const createSql = `
    CREATE TABLE IF NOT EXISTS posts (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      content TEXT NOT NULL,
      likes INT NOT NULL DEFAULT 0,
      comments INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await pool.query(createSql);

  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM posts');
  if (rows[0].count === 0) {
    const seedPosts = [
      { name: 'Alice Brown', content: 'Had an amazing time hiking today! The views were breathtaking.', likes: 120, comments: 15 },
      { name: 'John Smith', content: 'Finally tried that new restaurant downtown. The food was incredible!', likes: 98, comments: 22 },
      { name: 'Emma Davis', content: 'Learning JavaScript has been a fun experience. Excited to build more projects!', likes: 134, comments: 9 },
      { name: 'Michael Johnson', content: 'Just finished my first marathon! Feeling proud and exhausted.', likes: 250, comments: 30 },
      { name: 'Sophia Garcia', content: 'Adopted a puppy today. Say hello to Max!', likes: 345, comments: 40 },
      { name: 'James Martinez', content: 'Exploring photography lately. Captured some great sunset shots.', likes: 87, comments: 11 },
      { name: 'Olivia Wilson', content: 'Spent the weekend gardening. Nature therapy is the best therapy.', likes: 156, comments: 20 },
      { name: 'Liam Thompson', content: 'Started a new book series. Highly recommend it to fantasy lovers.', likes: 110, comments: 8 },
      { name: 'Mia Anderson', content: 'Visited the art gallery today. The creativity on display was inspiring.', likes: 175, comments: 18 },
      { name: 'Ethan Moore', content: 'Weekend camping trip was a success! Great friends, food, and stories.', likes: 220, comments: 25 }
    ];

    const insertSql = 'INSERT INTO posts (id, name, content, likes, comments) VALUES ?';
    const values = seedPosts.map(p => [uuidv4(), p.name, p.content, p.likes, p.comments]);
    await pool.query(insertSql, [values]);
  }
}

// Helper to fetch all posts
async function getAllPosts() {
  const [rows] = await pool.query('SELECT id, name, content, likes, comments FROM posts ORDER BY created_at DESC');
  return rows;
}

// Helper to fetch single post
async function getPostById(id) {
  const [rows] = await pool.query('SELECT id, name, content, likes, comments FROM posts WHERE id = ?', [id]);
  return rows[0];
}

// Root route - redirect to posts
app.get('/', (req, res) => {
  res.redirect('/posts');
});

// List posts
app.get('/posts', async (req, res) => {
  try {
    const posts = await getAllPosts();
    res.render('first/post', { posts });
  } catch (err) {
    console.error('Error fetching posts', err);
    res.status(500).send('Failed to fetch posts');
  }
});

// Important: /posts/new must come before /posts/:id
app.get('/posts/new', (req, res) => {
  res.render('first/newpost');
});

// View single post
app.get('/posts/:id', async (req, res) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) {
      return res.status(404).send('Post not found');
    }
    res.render('first/viewPost.ejs', { post });
  } catch (err) {
    console.error('Error fetching post', err);
    res.status(500).send('Failed to fetch post');
  }
});

// Create post
app.post('/posts', async (req, res) => {
  const { name, content } = req.body;
  const likes = Number(req.body.likes || 0);
  const comments = Number(req.body.comments || 0);
  if (!name || !content) {
    return res.status(400).send('Name and content are required');
  }
  try {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO posts (id, name, content, likes, comments) VALUES (?, ?, ?, ?, ?)',
      [id, name, content, likes, comments]
    );
    res.redirect('/posts');
  } catch (err) {
    console.error('Error creating post', err);
    res.status(500).send('Failed to create post');
  }
});

// Delete post
app.get('/posts/:id/delete', async (req, res) => {
  try {
    await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.redirect('/posts');
  } catch (err) {
    console.error('Error deleting post', err);
    res.status(500).send('Failed to delete post');
  }
});

// Update post content
app.patch('/posts/:id', async (req, res) => {
  const newcontent = req.body.content;
  if (!newcontent) {
    return res.status(400).send('Content is required');
  }
  try {
    const [result] = await pool.query('UPDATE posts SET content = ? WHERE id = ?', [newcontent, req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Post not found');
    }
    res.redirect('/posts');
  } catch (err) {
    console.error('Error updating post', err);
    res.status(500).send('Failed to update post');
  }
});

// Edit page
app.get('/posts/:id/edit', async (req, res) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) {
      return res.status(404).send('Post not found');
    }
    res.render('first/edit', { post });
  } catch (err) {
    console.error('Error fetching post for edit', err);
    res.status(500).send('Failed to load post');
  }
});

async function startServer() {
  try {
    await initDb();
    app.listen(port, () => {
      console.log(`App listening at ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

startServer();