const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dbPromise = require('./db');
const EncryptionService = require('./encryption');

const app = express();
const port = 3001;
const JWT_SECRET = 'your-secret-key'; // Change this in production

app.use(cors());
app.use(express.json());

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Register
app.post('/api/register', async (req, res) => {
  const db = await dbPromise;

  try {
    const {
      username, fullname, email, phone, address, country, currency, password,
      subscription_plan, payment_method, card_number, expiry_month, expiry_year, cvv, billing_address
    } = req.body;

    // Start transaction for atomicity
    await new Promise((resolve, reject) => {
      db.beginTransaction(async (err) => {
        if (err) return reject(err);

        try {
          // Hash password
          const hashedPassword = await bcrypt.hash(password, 10);

          // Insert user
          const userResult = await new Promise((resolve, reject) => {
            db.query(
              'INSERT INTO users (username, fullname, email, phone, address, country, currency, password, is_paid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [username, fullname, email, phone, address, country, currency || 'USD', hashedPassword, subscription_plan !== 'free'],
              (err, result) => err ? reject(err) : resolve(result)
            );
          });

          const userId = userResult.insertId;

          let paymentMethodId = null;

          // Handle payment method if provided
          if (payment_method && card_number) {
            // Validate card number
            if (!EncryptionService.validateCardNumber(card_number)) {
              throw new Error('Invalid card number');
            }

            // Encrypt sensitive card data
            const encryptedCardNumber = EncryptionService.encrypt(card_number);
            const lastFour = card_number.slice(-4);

            const paymentResult = await new Promise((resolve, reject) => {
              db.query(
                'INSERT INTO payment_methods (user_id, payment_type, card_type, last_four, expiry_month, expiry_year, encrypted_card_number, billing_address, is_default, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [userId, payment_method, 'visa', lastFour, expiry_month, expiry_year, encryptedCardNumber, billing_address || address, true, 'active'],
                (err, result) => err ? reject(err) : resolve(result)
              );
            });

            paymentMethodId = paymentResult.insertId;
          }

          // Handle subscription
          if (subscription_plan && subscription_plan !== 'free') {
            const planDetails = {
              free: { amount: 0, name: 'Free Plan' },
              basic: { amount: 9.99, name: 'Basic Plan' },
              premium: { amount: 29.99, name: 'Premium Plan' },
              enterprise: { amount: 99.99, name: 'Enterprise Plan' }
            };

            const plan = planDetails[subscription_plan] || planDetails.free;
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1); // Monthly billing

            await new Promise((resolve, reject) => {
              db.query(
                'INSERT INTO subscriptions (user_id, plan_name, plan_type, status, amount, currency, billing_cycle, current_period_start, current_period_end, payment_method_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [userId, plan.name, subscription_plan, 'active', plan.amount, currency || 'USD', 'monthly', startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], paymentMethodId],
                (err) => err ? reject(err) : resolve()
              );
            });
          }

          // Commit transaction
          db.commit((err) => {
            if (err) {
              db.rollback();
              reject(err);
            } else {
              resolve();
            }
          });

          res.status(201).json({
            message: 'User registered successfully',
            userId,
            subscription: subscription_plan,
            hasPaymentMethod: !!paymentMethodId
          });

        } catch (error) {
          db.rollback();
          reject(error);
        }
      });
    });

  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username, email, or phone already exists' });
    }
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const db = await dbPromise;
    const { identifier, password } = req.body; // identifier can be username, email, or phone

    db.query(
      'SELECT * FROM users WHERE (username = ? OR email = ? OR phone = ?) AND status = "active"',
      [identifier, identifier, identifier],
      async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = results[0];
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            fullname: user.fullname,
            email: user.email,
            role: user.role,
            is_paid: user.is_paid
          }
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Get user profile (including currency)
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    db.query(
      'SELECT id, username, fullname, email, phone, address, country, currency, role, status, is_paid, created_at FROM users WHERE id = ?',
      [req.user.id],
      (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(results[0]);
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.get('/', (req, res) => {
  res.send('Hello from backend!');
});

// Expenses API
app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    db.query('SELECT * FROM expenses WHERE user_id = ?', [req.user.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.post('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { description, amount, date, category } = req.body;

    // First verify the user exists
    db.query('SELECT id FROM users WHERE id = ?', [req.user.id], (userErr, userResults) => {
      if (userErr) return res.status(500).json({ error: 'Database error' });
      if (userResults.length === 0) return res.status(401).json({ error: 'User not found' });

      // User exists, proceed with expense insertion
      db.query('INSERT INTO expenses (user_id, description, amount, date, category) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, description, amount, date, category || 'general'], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, description, amount, date, category: category || 'general' });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Income API
app.get('/api/income', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    db.query('SELECT * FROM income WHERE user_id = ? ORDER BY date DESC', [req.user.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.post('/api/income', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { description, amount, date, category } = req.body;

    // First verify the user exists
    db.query('SELECT id FROM users WHERE id = ?', [req.user.id], (userErr, userResults) => {
      if (userErr) return res.status(500).json({ error: 'Database error' });
      if (userResults.length === 0) return res.status(401).json({ error: 'User not found' });

      // User exists, proceed with income insertion
      db.query('INSERT INTO income (user_id, description, amount, date, category) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, description, amount, date, category || 'salary'], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, description, amount, date, category: category || 'salary' });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Goals API - Full CRUD
app.get('/api/goals', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { category, status, priority } = req.query;

    let query = 'SELECT * FROM goals WHERE user_id = ?';
    let params = [req.user.id];

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (priority && priority !== 'all') {
      query += ' AND priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY created_at DESC';

    db.query(query, params, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.get('/api/goals/:id', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { id } = req.params;

    db.query('SELECT * FROM goals WHERE id = ? AND user_id = ?', [id, req.user.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(404).json({ error: 'Goal not found' });
      res.json(results[0]);
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.post('/api/goals', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const {
      name,
      description,
      category,
      current,
      target,
      target_date,
      priority,
      notes
    } = req.body;

    // Basic validation and sanitization
    const safeName = typeof name === 'string' ? name.trim() : '';
    const safeCategory = typeof category === 'string' && category.trim() ? category.trim() : 'general';
    const safeCurrent = typeof current === 'number' ? current : parseFloat(current) || 0;
    const safeTarget = typeof target === 'number' ? target : parseFloat(target);
    const safePriority = typeof priority === 'string' && priority.trim() ? priority.trim() : 'medium';
    const safeNotes = typeof notes === 'string' ? notes : null;
    const safeDescription = typeof description === 'string' ? description : null;
    const safeTargetDate = (typeof target_date === 'string' && target_date.trim()) ? target_date.trim() : null;

    if (!safeName) {
      return res.status(400).json({ error: 'Goal name is required' });
    }
    if (!safeTarget || isNaN(safeTarget) || safeTarget <= 0) {
      return res.status(400).json({ error: 'Target amount must be a positive number' });
    }

    const progress_percentage = safeTarget > 0 ? (safeCurrent / safeTarget) * 100 : 0;

    // Verify user exists before inserting
    db.query('SELECT id FROM users WHERE id = ?', [req.user.id], (userErr, userResults) => {
      if (userErr) return res.status(500).json({ error: 'Database error' });
      if (userResults.length === 0) return res.status(401).json({ error: 'User not found' });

      // User exists, proceed with goal insertion
      db.query(
        `INSERT INTO goals
         (user_id, name, description, category, current, target, target_date, priority, progress_percentage, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, safeName, safeDescription, safeCategory, safeCurrent, safeTarget, safeTargetDate, safePriority, progress_percentage, safeNotes],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });

          // Return the created goal
          db.query('SELECT * FROM goals WHERE id = ?', [result.insertId], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results[0]);
          });
        }
      );
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.put('/api/goals/:id', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { id } = req.params;
    const {
      name,
      description,
      category,
      current,
      target,
      target_date,
      priority,
      status,
      notes
    } = req.body;

    const progress_percentage = target > 0 ? ((current || 0) / target) * 100 : 0;
    const completed_at = status === 'completed' ? new Date() : null;

    db.query(
      `UPDATE goals SET
       name = ?, description = ?, category = ?, current = ?, target = ?,
       target_date = ?, priority = ?, status = ?, progress_percentage = ?,
       completed_at = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [name, description, category, current, target, target_date, priority, status, progress_percentage, completed_at, notes, id, req.user.id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Goal not found' });

        // Return the updated goal
        db.query('SELECT * FROM goals WHERE id = ?', [id], (err, results) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json(results[0]);
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.delete('/api/goals/:id', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { id } = req.params;

    db.query('DELETE FROM goals WHERE id = ? AND user_id = ?', [id, req.user.id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Goal not found' });
      res.json({ success: true, message: 'Goal deleted successfully' });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.get('/api/goals/stats/summary', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const userId = req.user.id;

    const statsQuery = `
      SELECT
        COUNT(*) as total_goals,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_goals,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_goals,
        AVG(progress_percentage) as avg_progress,
        SUM(current) as total_current,
        SUM(target) as total_target,
        COUNT(CASE WHEN target_date < CURDATE() AND status != 'completed' THEN 1 END) as overdue_goals
      FROM goals
      WHERE user_id = ?
    `;

    db.query(statsQuery, [userId], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      const stats = results[0];
      stats.completion_rate = stats.total_goals > 0 ? (stats.completed_goals / stats.total_goals) * 100 : 0;
      stats.total_savings_rate = stats.total_target > 0 ? (stats.total_current / stats.total_target) * 100 : 0;

      res.json(stats);
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.post('/api/goals/:id/progress', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { id } = req.params;
    const { amount, description } = req.body;

    // First get current goal data
    db.query('SELECT * FROM goals WHERE id = ? AND user_id = ?', [id, req.user.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(404).json({ error: 'Goal not found' });

      const goal = results[0];
      const newCurrent = goal.current + amount;
      const newProgress = goal.target > 0 ? (newCurrent / goal.target) * 100 : 0;
      const newStatus = newCurrent >= goal.target ? 'completed' : goal.status;
      const completed_at = newStatus === 'completed' ? new Date() : goal.completed_at;

      // Update goal progress
      db.query(
        'UPDATE goals SET current = ?, progress_percentage = ?, status = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newCurrent, newProgress, newStatus, completed_at, id],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });

          // Log the progress update (you might want to create a progress_log table for this)
          res.json({
            success: true,
            goal: { ...goal, current: newCurrent, progress_percentage: newProgress, status: newStatus, completed_at }
          });
        }
      );
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Achievements API
app.get('/api/achievements', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    db.query('SELECT * FROM achievements WHERE user_id = ? ORDER BY unlocked DESC, created_at DESC', [req.user.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.post('/api/achievements', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { title, description, icon, category, requirement, reward, max_progress, rarity } = req.body;

    // Verify user exists before inserting
    db.query('SELECT id FROM users WHERE id = ?', [req.user.id], (userErr, userResults) => {
      if (userErr) return res.status(500).json({ error: 'Database error' });
      if (userResults.length === 0) return res.status(401).json({ error: 'User not found' });

      // User exists, proceed with achievement insertion
      db.query(
        'INSERT INTO achievements (user_id, title, description, icon, category, requirement, reward, max_progress, rarity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, title, description, icon, category, requirement, reward, max_progress, rarity],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({
            id: result.insertId,
            title,
            description,
            icon,
            category,
            requirement,
            reward,
            progress: 0,
            max_progress,
            unlocked: false,
            rarity
          });
        }
      );
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.put('/api/achievements/:id', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { id } = req.params;
    const { progress, unlocked } = req.body;

    let query = 'UPDATE achievements SET progress = ?';
    let params = [progress];

    if (unlocked) {
      query += ', unlocked = TRUE, unlocked_date = CURRENT_TIMESTAMP';
    }

    query += ' WHERE id = ? AND user_id = ?';
    params.push(id, req.user.id);

    db.query(query, params, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Achievement not found' });
      res.json({ success: true });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.delete('/api/achievements/test', async (req, res) => {
  console.log('DELETE achievement test route called');
  res.json({ success: true, message: 'Test route works' });
});

app.delete('/api/achievements/:id', authenticateToken, async (req, res) => {
  console.log('DELETE achievement route called for id:', req.params.id);
  try {
    const db = await dbPromise;
    const { id } = req.params;

    db.query('DELETE FROM achievements WHERE id = ? AND user_id = ?', [id, req.user.id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Achievement not found' });
      res.json({ success: true });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.get('/api/achievements/stats', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const userId = req.user.id;

    // Get achievement statistics
    const statsQuery = `
      SELECT
        COUNT(*) as total_achievements,
        SUM(CASE WHEN unlocked = TRUE THEN 1 ELSE 0 END) as unlocked_achievements,
        COALESCE(SUM(CASE WHEN unlocked = TRUE THEN CAST(SUBSTRING_INDEX(reward, ' ', 1) AS UNSIGNED) ELSE 0 END), 0) as total_points
      FROM achievements
      WHERE user_id = ?
    `;

    db.query(statsQuery, [userId], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      const stats = results[0];
      // Mock current streak - in a real app, you'd calculate this based on consecutive days of activity
      stats.current_streak = 7;

      res.json(stats);
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Tasks API
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    db.query('SELECT * FROM tasks WHERE user_id = ?', [req.user.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { title, status, priority } = req.body;

    // Verify user exists before inserting
    db.query('SELECT id FROM users WHERE id = ?', [req.user.id], (userErr, userResults) => {
      if (userErr) return res.status(500).json({ error: 'Database error' });
      if (userResults.length === 0) return res.status(401).json({ error: 'User not found' });

      // User exists, proceed with task insertion
      db.query('INSERT INTO tasks (user_id, title, status, priority) VALUES (?, ?, ?, ?)', [req.user.id, title, status, priority], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, title, status, priority });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Vehicle Expenses API
app.get('/api/vehicle-expenses', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    db.query('SELECT * FROM vehicle_expenses WHERE user_id = ?', [req.user.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.post('/api/vehicle-expenses', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { description, amount, date, vehicle } = req.body;

    // Verify user exists before inserting
    db.query('SELECT id FROM users WHERE id = ?', [req.user.id], (userErr, userResults) => {
      if (userErr) return res.status(500).json({ error: 'Database error' });
      if (userResults.length === 0) return res.status(401).json({ error: 'User not found' });

      // User exists, proceed with vehicle expense insertion
      db.query('INSERT INTO vehicle_expenses (user_id, description, amount, date, vehicle) VALUES (?, ?, ?, ?, ?)', [req.user.id, description, amount, date, vehicle], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, description, amount, date, vehicle });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Diary API
app.get('/api/diary', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    db.query('SELECT * FROM notes WHERE user_id = ?', [req.user.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.post('/api/diary', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { title, content, date } = req.body;

    // Verify user exists before inserting
    db.query('SELECT id FROM users WHERE id = ?', [req.user.id], (userErr, userResults) => {
      if (userErr) return res.status(500).json({ error: 'Database error' });
      if (userResults.length === 0) return res.status(401).json({ error: 'User not found' });

      // User exists, proceed with diary entry insertion
      db.query('INSERT INTO notes (user_id, title, content, date) VALUES (?, ?, ?, ?)', [req.user.id, title, content, date], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, title, content, date });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Summary API for dashboard
app.get('/api/summary', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const queries = [
      `SELECT SUM(amount) as total FROM expenses WHERE user_id = ${req.user.id}`,
      `SELECT COUNT(*) as total, SUM(CASE WHEN current >= target THEN 1 ELSE 0 END) as achieved FROM goals WHERE user_id = ${req.user.id}`,
      `SELECT COUNT(*) as total, SUM(CASE WHEN status != "done" THEN 1 ELSE 0 END) as pending FROM tasks WHERE user_id = ${req.user.id}`,
      `SELECT SUM(amount) as total FROM vehicle_expenses WHERE user_id = ${req.user.id}`
    ];

    Promise.all(queries.map(query => new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    }))).then(([expenses, goals, tasks, vehicle]) => {
      res.json({
        totalExpenses: expenses.total || 0,
        goalsProgress: goals.total ? Math.round((goals.achieved / goals.total) * 100) : 0,
        pendingTasks: tasks.pending || 0,
        vehicleExpenses: vehicle.total || 0
      });
    }).catch(err => res.status(500).json({ error: err.message }));
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Get user subscription information
app.get('/api/subscription', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    db.query(
      `SELECT s.*, pm.card_type, pm.last_four, pm.expiry_month, pm.expiry_year
       FROM subscriptions s
       LEFT JOIN payment_methods pm ON s.payment_method_id = pm.id
       WHERE s.user_id = ? AND s.status = 'active'
       ORDER BY s.created_at DESC LIMIT 1`,
      [req.user.id],
      (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) {
          return res.json({ plan_type: 'free', plan_name: 'Free Plan', amount: 0 });
        }
        res.json(results[0]);
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});