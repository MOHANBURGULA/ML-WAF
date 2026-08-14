const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Protected Web App Home Page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Secure Banking Portal (Protected Origin Target)</title>
      <style>
        body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; }
        .card { background: #1e293b; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #334155; }
        h1 { color: #38bdf8; font-size: 22px; }
        input, button { width: 100%; padding: 10px; margin-top: 10px; border-radius: 6px; border: 1px solid #475569; background: #0f172a; color: #fff; box-sizing: border-box; }
        button { background: #0284c7; font-weight: bold; cursor: pointer; border: none; }
        .badge { background: #10b981; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge">ORIGIN TARGET SERVER ONLINE (:3000)</span>
        <h1>Secure Enterprise Portal</h1>
        <p>This internal web application is protected by SentinelAI WAF Reverse Proxy.</p>

        <form action="/login" method="POST">
          <h3>Vulnerable Login Endpoint</h3>
          <input type="text" name="username" placeholder="Username (e.g. admin' OR '1'='1)" required />
          <input type="password" name="password" placeholder="Password" required />
          <button type="submit">Sign In to Dashboard</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

// Vulnerable Login Endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Simulated raw SQL query
  const rawSqlQuery = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}';`;
  console.log(`[Origin App :3000] Executing SQL Query: ${rawSqlQuery}`);

  res.send({
    status: 'success',
    message: 'Login successful via origin server!',
    executedQuery: rawSqlQuery,
    user: { id: 1, name: 'Administrator', role: 'SuperUser' }
  });
});

// Vulnerable Comment Endpoint (XSS)
app.post('/comment', (req, res) => {
  const { comment } = req.body;
  res.send(`<h1>Comment Published</h1><div>User Output: ${comment}</div>`);
});

// Vulnerable File Download Endpoint (Path Traversal)
app.get('/download', (req, res) => {
  const file = req.query.file;
  res.send({ message: `Reading file ${file} from filesystem...` });
});

app.listen(PORT, () => {
  console.log(`🎯 Vulnerable Origin Target Web App running on http://localhost:${PORT}`);
});
