const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dbPromise = require('./db');
const EncryptionService = require('./encryption');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;
const JWT_SECRET = 'your-secret-key'; // Change this in production

app.use(cors());
app.use(express.json());
// Serve uploaded files statically for image previews
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
      username, fullname, email, phone, address, country, currency, job_type, job_subcategory, password,
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
              'INSERT INTO users (username, fullname, email, phone, address, country, currency, job_type, job_subcategory, password, is_paid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [username, fullname, email, phone, address, country, currency || 'USD', job_type, job_subcategory, hashedPassword, subscription_plan !== 'free'],
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
      'SELECT id, username, fullname, email, phone, address, country, currency, job_type, job_subcategory, role, status, is_paid, created_at FROM users WHERE id = ?',
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

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: 'Progress amount must be a positive number' });
    }

    // First get current goal data
    db.query('SELECT * FROM goals WHERE id = ? AND user_id = ?', [id, req.user.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(404).json({ error: 'Goal not found' });

      const goal = results[0];
      const cur = Number(goal.current) || 0;
      const tgt = Number(goal.target) || 0;
      const newCurrent = cur + amt;
      const newProgress = tgt > 0 ? (newCurrent / tgt) * 100 : 0;
      const newStatus = newCurrent >= tgt ? 'completed' : goal.status;
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
    const { date } = req.query; // optional planned day filter YYYY-MM-DD
    const params = [req.user.id];
    let sql = 'SELECT * FROM tasks WHERE user_id = ?';
    if (date) {
      sql += ' AND planned_date = ?';
      params.push(date);
    }
    sql += ' ORDER BY planned_date IS NULL, planned_date ASC, FIELD(status, "inProgress","todo","done"), priority DESC, created_at DESC';
    db.query(sql, params, (err, results) => {
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
    const { title, status = 'todo', priority = 'medium', category = 'general', planned_date = null, allocated_hours = 0 } = req.body;

    // Verify user exists before inserting
    db.query('SELECT id FROM users WHERE id = ?', [req.user.id], (userErr, userResults) => {
      if (userErr) return res.status(500).json({ error: 'Database error' });
      if (userResults.length === 0) return res.status(401).json({ error: 'User not found' });

      // User exists, proceed with task insertion
      const sql = 'INSERT INTO tasks (user_id, title, status, priority, category, planned_date, allocated_hours) VALUES (?, ?, ?, ?, ?, ?, ?)';
      const vals = [req.user.id, title, status, priority, category, planned_date, allocated_hours];
      db.query(sql, vals, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, title, status, priority, category, planned_date, allocated_hours });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Update task (status, priority, category, planned_date, allocated_hours, title)
app.patch('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { id } = req.params;
    const allowed = ['title','status','priority','category','planned_date','allocated_hours'];
    const fields = [];
    const values = [];
    allowed.forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(req.body, k)) {
        fields.push(`${k} = ?`);
        values.push(req.body[k]);
      }
    });
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    // Ensure ownership
    db.query('SELECT id FROM tasks WHERE id = ? AND user_id = ?', [id, req.user.id], (chkErr, chk) => {
      if (chkErr) return res.status(500).json({ error: chkErr.message });
      if (chk.length === 0) return res.status(404).json({ error: 'Task not found' });

      const sql = `UPDATE tasks SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`;
      db.query(sql, [...values, id, req.user.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Delete task
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { id } = req.params;

    // Ensure ownership and task exists
    db.query('SELECT id FROM tasks WHERE id = ? AND user_id = ?', [id, req.user.id], (chkErr, chk) => {
      if (chkErr) return res.status(500).json({ error: chkErr.message });
      if (chk.length === 0) return res.status(404).json({ error: 'Task not found' });

      // Delete associated time logs first
      db.query('DELETE FROM task_time_logs WHERE task_id = ? AND user_id = ?', [id, req.user.id], (logErr) => {
        if (logErr) return res.status(500).json({ error: logErr.message });

        // Then delete the task
        db.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, req.user.id], (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true });
        });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Start tracking time for a task
app.post('/api/tasks/:id/start', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { id } = req.params;
    // Ensure task ownership
    db.query('SELECT id FROM tasks WHERE id = ? AND user_id = ?', [id, req.user.id], (tErr, taskRows) => {
      if (tErr) return res.status(500).json({ error: tErr.message });
      if (taskRows.length === 0) return res.status(404).json({ error: 'Task not found' });

      // Ensure no active log exists
      db.query('SELECT id FROM task_time_logs WHERE user_id = ? AND task_id = ? AND end_time IS NULL', [req.user.id, id], (lErr, logs) => {
        if (lErr) return res.status(500).json({ error: lErr.message });
        if (logs.length > 0) return res.status(400).json({ error: 'Task already running' });

        db.query('INSERT INTO task_time_logs (user_id, task_id, start_time) VALUES (?, ?, NOW())', [req.user.id, id], (insErr, result) => {
          if (insErr) return res.status(500).json({ error: insErr.message });
          // Optionally set status to inProgress
          db.query('UPDATE tasks SET status = "inProgress", updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', [id, req.user.id]);
          res.json({ success: true, log_id: result.insertId });
        });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Stop tracking time for a task
app.post('/api/tasks/:id/stop', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { id } = req.params;
    // Ensure task ownership
    db.query('SELECT id FROM tasks WHERE id = ? AND user_id = ?', [id, req.user.id], (tErr, taskRows) => {
      if (tErr) return res.status(500).json({ error: tErr.message });
      if (taskRows.length === 0) return res.status(404).json({ error: 'Task not found' });

      // Find open log
      db.query('SELECT id, start_time FROM task_time_logs WHERE user_id = ? AND task_id = ? AND end_time IS NULL ORDER BY start_time DESC LIMIT 1', [req.user.id, id], (lErr, logs) => {
        if (lErr) return res.status(500).json({ error: lErr.message });
        if (logs.length === 0) return res.status(400).json({ error: 'No active timer for this task' });
        const logId = logs[0].id;
        const updateSql = 'UPDATE task_time_logs SET end_time = NOW(), duration_minutes = TIMESTAMPDIFF(MINUTE, start_time, NOW()) WHERE id = ?';
        db.query(updateSql, [logId], (uErr) => {
          if (uErr) return res.status(500).json({ error: uErr.message });
          res.json({ success: true });
        });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Active timers for current user
app.get('/api/tasks/logs/active', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const sql = 'SELECT task_id, start_time FROM task_time_logs WHERE user_id = ? AND end_time IS NULL';
    db.query(sql, [req.user.id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Accumulated completed time per task (in minutes)
app.get('/api/tasks/time/summary', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const sql = `
      SELECT task_id, COALESCE(SUM(duration_minutes), 0) AS minutes
      FROM task_time_logs
      WHERE user_id = ? AND end_time IS NOT NULL
      GROUP BY task_id
    `;
    db.query(sql, [req.user.id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Monthly summary of time per category: ?month=YYYY-MM
app.get('/api/tasks/summary', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { month } = req.query; // format YYYY-MM
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Invalid month format. Expected YYYY-MM' });
    }
    const start = `${month}-01`;
    const end = `${month}-31`;
    const sql = `
      SELECT t.category, COALESCE(SUM(l.duration_minutes), 0) AS minutes
      FROM tasks t
      JOIN task_time_logs l ON l.task_id = t.id AND l.user_id = t.user_id
      WHERE t.user_id = ? AND l.end_time IS NOT NULL AND l.start_time BETWEEN ? AND ?
      GROUP BY t.category
      ORDER BY minutes DESC`;
    db.query(sql, [req.user.id, start, end], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const data = rows.map(r => ({ category: r.category, hours: Number((r.minutes / 60).toFixed(2)) }));
      res.json({ month, data });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Time logs for a specific task
app.get('/api/tasks/:id/logs', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { id } = req.params;
    console.log('Fetching logs for task:', id, 'user:', req.user.id);

    // Ensure task ownership
    db.query('SELECT id FROM tasks WHERE id = ? AND user_id = ?', [id, req.user.id], (chkErr, chk) => {
      if (chkErr) {
        console.error('Database error checking task ownership:', chkErr);
        return res.status(500).json({ error: chkErr.message });
      }
      if (chk.length === 0) {
        console.log('Task not found or not owned by user');
        return res.status(404).json({ error: 'Task not found' });
      }

      const sql = 'SELECT id, start_time, end_time, duration_minutes FROM task_time_logs WHERE task_id = ? AND user_id = ? ORDER BY start_time DESC';
      db.query(sql, [id, req.user.id], (err, rows) => {
        if (err) {
          console.error('Database error fetching time logs:', err);
          return res.status(500).json({ error: err.message });
        }
        console.log('Found', rows.length, 'time log entries');
        res.json(rows);
      });
    });
  } catch (err) {
    console.error('Server error in task logs route:', err);
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Vehicle Expenses API
app.get('/api/vehicle-expenses', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    db.query('SELECT id, user_id, description, amount, date, vehicle FROM vehicle_expenses WHERE user_id = ?', [req.user.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      const mapped = results.map(r => ({
        id: r.id,
        description: r.description,
        amount: Math.abs(Number(r.amount)),
        date: r.date,
        vehicle: r.vehicle,
        type: Number(r.amount) < 0 ? 'income' : 'expense',
      }));
      res.json(mapped);
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.post('/api/vehicle-expenses', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    let { description, amount, date, vehicle, type } = req.body;

    // Verify user exists before inserting
    db.query('SELECT id FROM users WHERE id = ?', [req.user.id], (userErr, userResults) => {
      if (userErr) return res.status(500).json({ error: 'Database error' });
      if (userResults.length === 0) return res.status(401).json({ error: 'User not found' });

      // User exists, proceed with vehicle expense insertion
      const signedAmount = (type === 'income') ? -Math.abs(Number(amount)) : Math.abs(Number(amount));
      db.query('INSERT INTO vehicle_expenses (user_id, description, amount, date, vehicle) VALUES (?, ?, ?, ?, ?)', [req.user.id, description, signedAmount, date, vehicle], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, description, amount: Math.abs(Number(amount)), date, vehicle, type: type === 'income' ? 'income' : 'expense' });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Update vehicle expense/income
app.patch('/api/vehicle-expenses/:id', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { id } = req.params;
    const { description, amount, date, vehicle, type } = req.body;

    // Ensure ownership and get current row
    db.query('SELECT id, amount FROM vehicle_expenses WHERE id = ? AND user_id = ?', [id, req.user.id], (chkErr, rows) => {
      if (chkErr) return res.status(500).json({ error: chkErr.message });
      if (rows.length === 0) return res.status(404).json({ error: 'Entry not found' });

      const fields = [];
      const vals = [];
      if (description !== undefined) { fields.push('description = ?'); vals.push(description); }
      if (date !== undefined) { fields.push('date = ?'); vals.push(date); }
      if (vehicle !== undefined) { fields.push('vehicle = ?'); vals.push(vehicle); }
      if (amount !== undefined) {
        const signed = (type === 'income') ? -Math.abs(Number(amount)) : (type === 'expense') ? Math.abs(Number(amount)) : (Number(rows[0].amount) < 0 ? -Math.abs(Number(amount)) : Math.abs(Number(amount)));
        fields.push('amount = ?'); vals.push(signed);
      } else if (type !== undefined) {
        // flip sign based on type if only type changes
        const current = Number(rows[0].amount);
        const newVal = type === 'income' ? -Math.abs(current) : Math.abs(current);
        fields.push('amount = ?'); vals.push(newVal);
      }
      if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

      const sql = `UPDATE vehicle_expenses SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`;
      db.query(sql, [...vals, id, req.user.id], (uErr) => {
        if (uErr) return res.status(500).json({ error: uErr.message });
        res.json({ success: true });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Delete vehicle expense/income
app.delete('/api/vehicle-expenses/:id', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { id } = req.params;
    db.query('DELETE FROM vehicle_expenses WHERE id = ? AND user_id = ?', [id, req.user.id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Entry not found' });
      res.json({ success: true });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Vehicles API
app.get('/api/vehicles', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    db.query('SELECT id, name, make, model, year, vehicle_no FROM vehicles WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.post('/api/vehicles', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { name, make, model, year, vehicle_no } = req.body;

    // Verify user exists before inserting
    db.query('SELECT id FROM users WHERE id = ?', [req.user.id], (userErr, userResults) => {
      if (userErr) return res.status(500).json({ error: 'Database error' });
      if (userResults.length === 0) return res.status(401).json({ error: 'User not found' });

      // User exists, proceed with vehicle insertion
      db.query('INSERT INTO vehicles (user_id, name, make, model, year, vehicle_no) VALUES (?, ?, ?, ?, ?, ?)', [req.user.id, name, make, model, year, vehicle_no], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, name, make, model, year, vehicle_no });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.patch('/api/vehicles/:id', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { id } = req.params;
    const { name, make, model, year, vehicle_no } = req.body;

    const fields = [];
    const vals = [];
    if (name !== undefined) { fields.push('name = ?'); vals.push(name); }
    if (make !== undefined) { fields.push('make = ?'); vals.push(make); }
    if (model !== undefined) { fields.push('model = ?'); vals.push(model); }
    if (year !== undefined) { fields.push('year = ?'); vals.push(year); }
    if (vehicle_no !== undefined) { fields.push('vehicle_no = ?'); vals.push(vehicle_no); }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    // Ensure ownership
    db.query('SELECT id FROM vehicles WHERE id = ? AND user_id = ?', [id, req.user.id], (chkErr, chk) => {
      if (chkErr) return res.status(500).json({ error: chkErr.message });
      if (chk.length === 0) return res.status(404).json({ error: 'Vehicle not found' });

      const sql = `UPDATE vehicles SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`;
      db.query(sql, [...vals, id, req.user.id], (uErr) => {
        if (uErr) return res.status(500).json({ error: uErr.message });
        res.json({ success: true });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.delete('/api/vehicles/:id', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { id } = req.params;

    // Ensure ownership
    db.query('SELECT id FROM vehicles WHERE id = ? AND user_id = ?', [id, req.user.id], (chkErr, chk) => {
      if (chkErr) return res.status(500).json({ error: chkErr.message });
      if (chk.length === 0) return res.status(404).json({ error: 'Vehicle not found' });

      db.query('DELETE FROM vehicles WHERE id = ? AND user_id = ?', [id, req.user.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
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
    db.query('SELECT id, user_id, title, content, DATE_FORMAT(date, "%Y-%m-%d") as date, mood, one_sentence FROM notes WHERE user_id = ?', [req.user.id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Password Manager APIs
app.get('/api/passwords', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    db.query(
      'SELECT id, platform, email, username, encrypted_password, notes, created_at, updated_at FROM password_entries WHERE user_id = ?',
      [req.user.id],
      (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        // Decrypt passwords for display to the authenticated user
        const rows = results.map(r => ({
          id: r.id,
          platform: r.platform,
          email: r.email,
          username: r.username,
          password: EncryptionService.decrypt(r.encrypted_password) || '',
          notes: r.notes,
          created_at: r.created_at,
          updated_at: r.updated_at,
        }));
        res.json(rows);
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.post('/api/passwords', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { platform, email, username, password, notes } = req.body;
    if (!platform) return res.status(400).json({ error: 'Platform is required' });
    const enc = EncryptionService.encrypt(password || '');
    if (password && !enc) {
      console.error('Encryption returned null for password');
    }
    db.query(
      'INSERT INTO password_entries (user_id, platform, email, username, encrypted_password, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, platform, email, username, enc, notes || null],
      (err, result) => {
        if (err) {
          console.error('Insert password entry failed:', err.message);
          return res.status(500).json({ error: err.message });
        }
        res.json({ id: result.insertId, platform, email, username, password, notes });
      }
    );
  } catch (err) {
    console.error('POST /api/passwords error:', err.message);
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.put('/api/passwords/:id', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { id } = req.params;
    const { platform, email, username, password, notes } = req.body;
    const enc = EncryptionService.encrypt(password || '');
    db.query(
      'UPDATE password_entries SET platform = ?, email = ?, username = ?, encrypted_password = ?, notes = ? WHERE id = ? AND user_id = ?',
      [platform, email, username, enc, notes || null, id, req.user.id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Entry not found' });
        res.json({ id, platform, email, username, password, notes });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.delete('/api/passwords/:id', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { id } = req.params;
    db.query(
      'DELETE FROM password_entries WHERE id = ? AND user_id = ?',
      [id, req.user.id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Entry not found' });
        res.json({ success: true });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.put('/api/diary/:id', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { id } = req.params;
    const { title, content, date, mood, one_sentence } = req.body;

    db.query('UPDATE notes SET title = ?, content = ?, date = ?, mood = ?, one_sentence = ? WHERE id = ? AND user_id = ?', [title, content, date, mood, one_sentence, id, req.user.id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Note not found' });
      res.json({ id, title, content, date, mood, one_sentence });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.post('/api/diary', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { title, content, date, mood, one_sentence } = req.body;

    // Verify user exists before inserting
    db.query('SELECT id FROM users WHERE id = ?', [req.user.id], (userErr, userResults) => {
      if (userErr) return res.status(500).json({ error: 'Database error' });
      if (userResults.length === 0) return res.status(401).json({ error: 'User not found' });

      // Check if a note for this date already exists for the user
      db.query('SELECT id FROM notes WHERE user_id = ? AND date = ?', [req.user.id, date], (findErr, findResults) => {
        if (findErr) return res.status(500).json({ error: findErr.message });

        if (findResults.length > 0) {
          const noteId = findResults[0].id;
          // Update existing note
          db.query(
            'UPDATE notes SET title = ?, content = ?, date = ?, mood = ?, one_sentence = ? WHERE id = ? AND user_id = ?',
            [title, content, date, mood, one_sentence, noteId, req.user.id],
            (updErr) => {
              if (updErr) return res.status(500).json({ error: updErr.message });
              res.json({ id: noteId, title, content, date, mood, one_sentence });
            }
          );
        } else {
          // Insert new note
          db.query(
            'INSERT INTO notes (user_id, title, content, date, mood, one_sentence) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, title, content, date, mood, one_sentence],
            (insErr, result) => {
              if (insErr) return res.status(500).json({ error: insErr.message });
              res.json({ id: result.insertId, title, content, date, mood, one_sentence });
            }
          );
        }
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

// API Keys APIs
app.get('/api/api-keys', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    db.query(
      'SELECT id, name, api_key, api_secret, project_name, provider, environment, notes, created_at, updated_at FROM api_keys WHERE user_id = ?',
      [req.user.id],
      (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        // Decrypt API keys and secrets for display to the authenticated user
        const rows = results.map(r => ({
          id: r.id,
          name: r.name,
          api_key: EncryptionService.decrypt(r.api_key) || '',
          api_secret: r.api_secret ? EncryptionService.decrypt(r.api_secret) : null,
          project_name: r.project_name,
          provider: r.provider,
          environment: r.environment,
          notes: r.notes,
          created_at: r.created_at,
          updated_at: r.updated_at,
        }));
        res.json(rows);
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.post('/api/api-keys', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { name, api_key, api_secret, project_name, provider, environment, notes } = req.body;
    if (!name || !api_key || !project_name) return res.status(400).json({ error: 'Name, API key, and project name are required' });
    const encApiKey = EncryptionService.encrypt(api_key);
    const encApiSecret = api_secret ? EncryptionService.encrypt(api_secret) : null;
    if (!encApiKey) {
      console.error('Encryption returned null for API key');
    }
    db.query(
      'INSERT INTO api_keys (user_id, name, api_key, api_secret, project_name, provider, environment, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, name, encApiKey, encApiSecret, project_name, provider || null, environment || 'development', notes || null],
      (err, result) => {
        if (err) {
          console.error('Insert API key failed:', err.message);
          return res.status(500).json({ error: err.message });
        }
        res.json({ id: result.insertId, name, api_key, api_secret, project_name, provider, environment, notes });
      }
    );
  } catch (err) {
    console.error('POST /api/api-keys error:', err.message);
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.put('/api/api-keys/:id', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { id } = req.params;
    const { name, api_key, api_secret, project_name, provider, environment, notes } = req.body;
    const encApiKey = EncryptionService.encrypt(api_key);
    const encApiSecret = api_secret ? EncryptionService.encrypt(api_secret) : null;
    db.query(
      'UPDATE api_keys SET name = ?, api_key = ?, api_secret = ?, project_name = ?, provider = ?, environment = ?, notes = ? WHERE id = ? AND user_id = ?',
      [name, encApiKey, encApiSecret, project_name, provider || null, environment || 'development', notes || null, id, req.user.id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'API key not found' });
        res.json({ id, name, api_key, api_secret, project_name, provider, environment, notes });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.delete('/api/api-keys/:id', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { id } = req.params;
    db.query(
      'DELETE FROM api_keys WHERE id = ? AND user_id = ?',
      [id, req.user.id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'API key not found' });
        res.json({ success: true });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Projects API
app.get('/api/projects', authenticateToken, async (req, res) => {
  const db = await dbPromise;
  try {
    const userId = req.user.id;
    db.query('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
  const db = await dbPromise;
  try {
    const userId = req.user.id;
    const { name, description, budget, start_date, end_date, client_name, priority } = req.body;

    db.query(
      'INSERT INTO projects (user_id, name, description, budget, start_date, end_date, client_name, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, name, description, budget || 0, start_date, end_date, client_name, priority || 'medium'],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({
          id: result.insertId,
          name,
          description,
          budget: budget || 0,
          start_date,
          end_date,
          client_name,
          priority: priority || 'medium',
          status: 'planning'
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.put('/api/projects/:id', authenticateToken, async (req, res) => {
  const db = await dbPromise;
  try {
    const userId = req.user.id;
    const projectId = req.params.id;
    const { name, description, budget, start_date, end_date, client_name, priority, status } = req.body;

    db.query(
      'UPDATE projects SET name = ?, description = ?, budget = ?, start_date = ?, end_date = ?, client_name = ?, priority = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [name, description, budget, start_date, end_date, client_name, priority, status, projectId, userId],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Project not found' });
        res.json({ success: true });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  const db = await dbPromise;
  try {
    const userId = req.user.id;
    const projectId = req.params.id;

    db.query('DELETE FROM projects WHERE id = ? AND user_id = ?', [projectId, userId], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Project not found' });
      res.json({ success: true });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Time Entries API
app.get('/api/project-time-entries', authenticateToken, async (req, res) => {
  const db = await dbPromise;
  try {
    const userId = req.user.id;
    db.query('SELECT * FROM project_time_entries WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.post('/api/project-time-entries', authenticateToken, async (req, res) => {
  const db = await dbPromise;
  try {
    const userId = req.user.id;
    const { project_id, description, start_time, is_running } = req.body;

    db.query(
      'INSERT INTO project_time_entries (user_id, project_id, description, start_time, is_running) VALUES (?, ?, ?, ?, ?)',
      [userId, project_id, description, start_time, is_running || false],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({
          id: result.insertId,
          project_id,
          description,
          start_time,
          is_running: is_running || false
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.put('/api/project-time-entries/:id', authenticateToken, async (req, res) => {
  const db = await dbPromise;
  try {
    const userId = req.user.id;
    const entryId = req.params.id;
    const { end_time, is_running } = req.body;

    let query, params;
    if (end_time) {
      // Calculate duration in minutes
      const startTime = new Date((await new Promise((resolve, reject) => {
        db.query('SELECT start_time FROM project_time_entries WHERE id = ? AND user_id = ?', [entryId, userId], (err, results) => {
          if (err) reject(err);
          else resolve(results[0]?.start_time);
        });
      })));
      const endTime = new Date(end_time);
      const duration = Math.floor((endTime - startTime) / (1000 * 60)); // minutes

      query = 'UPDATE project_time_entries SET end_time = ?, duration = ?, is_running = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?';
      params = [end_time, duration, is_running || false, entryId, userId];
    } else {
      query = 'UPDATE project_time_entries SET is_running = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?';
      params = [is_running || false, entryId, userId];
    }

    db.query(query, params, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Time entry not found' });
      res.json({ success: true });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Purchases API
app.get('/api/project-purchases', authenticateToken, async (req, res) => {
  const db = await dbPromise;
  try {
    const userId = req.user.id;
    db.query('SELECT * FROM project_purchases WHERE user_id = ? ORDER BY date DESC', [userId], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.post('/api/project-purchases', authenticateToken, async (req, res) => {
  const db = await dbPromise;
  try {
    const userId = req.user.id;
    const { project_id, item_name, cost, category, vendor, date } = req.body;

    db.query(
      'INSERT INTO project_purchases (user_id, project_id, item_name, cost, category, vendor, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, project_id, item_name, cost, category, vendor, date],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // Update project spent amount
        db.query('UPDATE projects SET spent = spent + ? WHERE id = ? AND user_id = ?', [cost, project_id, userId]);

        res.status(201).json({
          id: result.insertId,
          project_id,
          item_name,
          cost,
          category,
          vendor,
          date
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.put('/api/project-purchases/:id', authenticateToken, async (req, res) => {
  const db = await dbPromise;
  try {
    const userId = req.user.id;
    const purchaseId = req.params.id;
    const { item_name, cost, category, vendor, date } = req.body;

    // Get old cost for updating project spent
    const oldPurchase = await new Promise((resolve, reject) => {
      db.query('SELECT cost, project_id FROM project_purchases WHERE id = ? AND user_id = ?', [purchaseId, userId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });

    if (!oldPurchase) return res.status(404).json({ error: 'Purchase not found' });

    const costDifference = cost - oldPurchase.cost;

    db.query(
      'UPDATE project_purchases SET item_name = ?, cost = ?, category = ?, vendor = ?, date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [item_name, cost, category, vendor, date, purchaseId, userId],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Purchase not found' });

        // Update project spent amount
        db.query('UPDATE projects SET spent = spent + ? WHERE id = ? AND user_id = ?', [costDifference, oldPurchase.project_id, userId]);

        res.json({ success: true });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.delete('/api/project-purchases/:id', authenticateToken, async (req, res) => {
  const db = await dbPromise;
  try {
    const userId = req.user.id;
    const purchaseId = req.params.id;

    // Get purchase details before deleting
    const purchase = await new Promise((resolve, reject) => {
      db.query('SELECT cost, project_id FROM project_purchases WHERE id = ? AND user_id = ?', [purchaseId, userId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });

    if (!purchase) return res.status(404).json({ error: 'Purchase not found' });

    db.query('DELETE FROM project_purchases WHERE id = ? AND user_id = ?', [purchaseId, userId], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Purchase not found' });

      // Update project spent amount
      db.query('UPDATE projects SET spent = spent - ? WHERE id = ? AND user_id = ?', [purchase.cost, purchase.project_id, userId]);

      res.json({ success: true });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Project Income endpoints
app.get('/api/project-income', authenticateToken, async (req, res) => {
  const db = await dbPromise;
  const userId = req.user.id;

  try {
    db.query('SELECT * FROM project_income WHERE user_id = ? ORDER BY date DESC', [userId], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.post('/api/project-income', authenticateToken, async (req, res) => {
  const db = await dbPromise;
  const userId = req.user.id;
  const { project_id, description, amount, category, date } = req.body;

  if (!project_id || !description || !amount || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    db.query(
      'INSERT INTO project_income (user_id, project_id, description, amount, category, date) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, project_id, description, amount, category || 'project_revenue', date],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // Update project budget (income increases available budget)
        db.query('UPDATE projects SET budget = budget + ? WHERE id = ? AND user_id = ?', [amount, project_id, userId]);

        res.json({
          id: result.insertId,
          user_id: userId,
          project_id,
          description,
          amount,
          category: category || 'project_revenue',
          date
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.put('/api/project-income/:id', authenticateToken, async (req, res) => {
  const db = await dbPromise;
  const userId = req.user.id;
  const incomeId = req.params.id;
  const { description, amount, category, date } = req.body;

  try {
    // Get current income record
    db.query('SELECT * FROM project_income WHERE id = ? AND user_id = ?', [incomeId, userId], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(404).json({ error: 'Income record not found' });

      const currentIncome = results[0];
      const oldAmount = currentIncome.amount;
      const newAmount = amount || oldAmount;

      // Update income record
      db.query(
        'UPDATE project_income SET description = ?, amount = ?, category = ?, date = ? WHERE id = ? AND user_id = ?',
        [description || currentIncome.description, newAmount, category || currentIncome.category, date || currentIncome.date, incomeId, userId],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });

          // Update project budget (adjust by the difference)
          const amountDifference = newAmount - oldAmount;
          db.query('UPDATE projects SET budget = budget + ? WHERE id = ? AND user_id = ?', [amountDifference, currentIncome.project_id, userId]);

          res.json({ success: true });
        }
      );
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.delete('/api/project-income/:id', authenticateToken, async (req, res) => {
  const db = await dbPromise;
  const userId = req.user.id;
  const incomeId = req.params.id;

  try {
    // Get income record before deletion
    db.query('SELECT * FROM project_income WHERE id = ? AND user_id = ?', [incomeId, userId], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(404).json({ error: 'Income record not found' });

      const income = results[0];

      // Delete income record
      db.query('DELETE FROM project_income WHERE id = ? AND user_id = ?', [incomeId, userId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // Update project budget (subtract the income amount)
        db.query('UPDATE projects SET budget = budget - ? WHERE id = ? AND user_id = ?', [income.amount, income.project_id, userId]);

        res.json({ success: true });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Project Documents API
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv',
      'application/zip', 'application/x-rar-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Gem Business: Purchases with image upload
app.get('/api/gem/purchases', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    db.query('SELECT p.*, i.id as inventory_id FROM gem_purchases p LEFT JOIN gem_inventory i ON p.id = i.purchase_id WHERE p.user_id = ? ORDER BY p.date DESC, p.created_at DESC', [req.user.id], (err, purchases) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!purchases || purchases.length === 0) return res.json([]);
      
      // Get inventory IDs that have images
      const inventoryIds = purchases.filter(p => p.inventory_id).map(p => p.inventory_id);
      if (inventoryIds.length === 0) {
        const result = purchases.map(p => ({
          ...p,
          images: []
        }));
        return res.json(result);
      }
      
      db.query('SELECT * FROM gem_inventory_images WHERE inventory_id IN (?)', [inventoryIds], (imgErr, images) => {
        if (imgErr) return res.status(500).json({ error: imgErr.message });
        const grouped = images.reduce((acc, img) => {
          acc[img.inventory_id] = acc[img.inventory_id] || [];
          acc[img.inventory_id].push({
            id: img.id,
            file_name: img.file_name,
            original_name: img.original_name,
            file_size: img.file_size,
            mime_type: img.mime_type,
            uploaded_at: img.uploaded_at,
            url: `/uploads/${img.file_name}`
          });
          return acc;
        }, {});
        const result = purchases.map(p => ({
          ...p,
          images: grouped[p.inventory_id] || []
        }));
        res.json(result);
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Gem Business: Inventory/Stock management
app.get('/api/gem/inventory', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { gem_name, weight_min, weight_max, color, status, page = 1, limit = 20 } = req.query;
    
    let query = 'SELECT * FROM gem_inventory WHERE user_id = ?';
    const params = [req.user.id];
    
    if (gem_name) {
      query += ' AND gem_name LIKE ?';
      params.push(`%${gem_name}%`);
    }
    if (weight_min) {
      query += ' AND weight >= ?';
      params.push(Number(weight_min));
    }
    if (weight_max) {
      query += ' AND weight <= ?';
      params.push(Number(weight_max));
    }
    if (color) {
      query += ' AND color LIKE ?';
      params.push(`%${color}%`);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT ${Number(limit)} OFFSET ${offset}`;
    
    db.query(query, params, (err, items) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM gem_inventory WHERE user_id = ?';
      const countParams = [req.user.id];
      let paramIndex = 0;
      
      if (gem_name) {
        countQuery += ' AND gem_name LIKE ?';
        countParams.push(`%${gem_name}%`);
      }
      if (weight_min) {
        countQuery += ' AND weight >= ?';
        countParams.push(Number(weight_min));
      }
      if (weight_max) {
        countQuery += ' AND weight <= ?';
        countParams.push(Number(weight_max));
      }
      if (color) {
        countQuery += ' AND color LIKE ?';
        countParams.push(`%${color}%`);
      }
      if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }
      
      db.query(countQuery, countParams, (countErr, countResult) => {
        if (countErr) return res.status(500).json({ error: countErr.message });
        
        if (!items || items.length === 0) {
          return res.json({ items: [], total: countResult[0].total, page: Number(page), limit: Number(limit) });
        }
        
        const ids = items.map(i => i.id);
        db.query('SELECT * FROM gem_inventory_images WHERE inventory_id IN (?)', [ids], (imgErr, images) => {
          if (imgErr) return res.status(500).json({ error: imgErr.message });
          
          const grouped = images.reduce((acc, img) => {
            acc[img.inventory_id] = acc[img.inventory_id] || [];
            acc[img.inventory_id].push({
              id: img.id,
              file_name: img.file_name,
              original_name: img.original_name,
              url: `/uploads/${img.file_name}`
            });
            return acc;
          }, {});
          
          const result = items.map(i => ({
            ...i,
            images: grouped[i.id] || []
          }));
          
          res.json({
            items: result,
            total: countResult[0].total,
            page: Number(page),
            limit: Number(limit)
          });
        });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.post('/api/gem/inventory', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const db = await dbPromise;
    const files = req.files || [];
    const { gem_name, weight, color, clarity, cut, shape, origin, purchase_price, current_value, quantity, description, purchase_id } = req.body;
    
    const purchasePrice = Number(purchase_price);
    const wt = Number(weight);
    
    if (!gem_name || !gem_name.trim()) {
      files.forEach(f => { try { if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path); } catch(_){} });
      return res.status(400).json({ error: 'Gem name is required' });
    }
    if (!Number.isFinite(wt) || wt <= 0) {
      files.forEach(f => { try { if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path); } catch(_){} });
      return res.status(400).json({ error: 'Weight must be a positive number' });
    }
    if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
      files.forEach(f => { try { if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path); } catch(_){} });
      return res.status(400).json({ error: 'Purchase price must be a non-negative number' });
    }
    
    const safeGemName = gem_name.trim();
    const safeColor = typeof color === 'string' ? color.trim() : null;
    const safeClarity = typeof clarity === 'string' ? clarity.trim() : null;
    const safeCut = typeof cut === 'string' ? cut.trim() : null;
    const safeShape = typeof shape === 'string' ? shape.trim() : null;
    const safeOrigin = typeof origin === 'string' ? origin.trim() : null;
    const safeCurrentValue = current_value ? Number(current_value) : purchasePrice;
    const safeQuantity = quantity ? Number(quantity) : 1;
    const safeDescription = typeof description === 'string' ? description.trim() : null;
    const safePurchaseId = purchase_id ? Number(purchase_id) : null;
    
    db.query('SELECT id FROM users WHERE id = ?', [req.user.id], (userErr, userRows) => {
      if (userErr) return res.status(500).json({ error: 'Database error' });
      if (!userRows || userRows.length === 0) return res.status(401).json({ error: 'User not found' });
      
      db.query(
        'INSERT INTO gem_inventory (user_id, gem_name, weight, color, clarity, cut, shape, origin, purchase_price, current_value, quantity, purchase_id, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, safeGemName, wt, safeColor, safeClarity, safeCut, safeShape, safeOrigin, purchasePrice, safeCurrentValue, safeQuantity, safePurchaseId, safeDescription],
        (insErr, result) => {
          if (insErr) {
            files.forEach(f => { try { if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path); } catch(_){} });
            return res.status(500).json({ error: insErr.message });
          }
          
          const inventoryId = result.insertId;
          
          if (!files || files.length === 0) {
            return res.status(201).json({
              id: inventoryId,
              user_id: req.user.id,
              gem_name: safeGemName,
              weight: wt,
              color: safeColor,
              purchase_price: purchasePrice,
              current_value: safeCurrentValue,
              quantity: safeQuantity,
              images: []
            });
          }
          
          const values = files.map(f => [inventoryId, f.filename, f.originalname, f.size, f.mimetype]);
          db.query(
            'INSERT INTO gem_inventory_images (inventory_id, file_name, original_name, file_size, mime_type) VALUES ?',
            [values],
            (imgErr) => {
              if (imgErr) return res.status(500).json({ error: imgErr.message });
              
              const images = files.map(f => ({
                file_name: f.filename,
                original_name: f.originalname,
                url: `/uploads/${f.filename}`
              }));
              
              res.status(201).json({
                id: inventoryId,
                user_id: req.user.id,
                gem_name: safeGemName,
                weight: wt,
                color: safeColor,
                purchase_price: purchasePrice,
                current_value: safeCurrentValue,
                quantity: safeQuantity,
                images
              });
            }
          );
        }
      );
    });
  } catch (err) {
    try {
      const files = req.files || [];
      files.forEach(f => { if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path); });
    } catch(_){}
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.post('/api/gem/purchases', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const db = await dbPromise;
    const files = req.files || [];
    const { description, amount, date, vendor, gem_name, weight, color, clarity, cut, shape, origin } = req.body;
    const amt = Number(amount);
    const wt = Number(weight);
    if (!gem_name || !gem_name.trim()) {
      // Cleanup uploaded temp files when validation fails
      files.forEach(f => { try { if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path); } catch(_){} });
      return res.status(400).json({ error: 'Gem name is required' });
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      // Cleanup uploaded temp files when validation fails
      files.forEach(f => { try { if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path); } catch(_){} });
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    if (!Number.isFinite(wt) || wt <= 0) {
      // Cleanup uploaded temp files when validation fails
      files.forEach(f => { try { if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path); } catch(_){} });
      return res.status(400).json({ error: 'Weight must be a positive number' });
    }

    const safeDesc = typeof description === 'string' ? description.trim() : '';
    const safeVendor = typeof vendor === 'string' ? vendor.trim() : null;
    const safeDate = (typeof date === 'string' && date.trim()) ? date.trim() : new Date().toISOString().slice(0,10);
    const safeGemName = gem_name.trim();
    const safeColor = typeof color === 'string' && color.trim() ? color.trim() : null;
    const safeClarity = typeof clarity === 'string' && clarity.trim() ? clarity.trim() : null;
    const safeCut = typeof cut === 'string' && cut.trim() ? cut.trim() : null;
    const safeShape = typeof shape === 'string' && shape.trim() ? shape.trim() : null;
    const safeOrigin = typeof origin === 'string' && origin.trim() ? origin.trim() : null;

    // Verify user exists
    db.query('SELECT id FROM users WHERE id = ?', [req.user.id], (userErr, userRows) => {
      if (userErr) return res.status(500).json({ error: 'Database error' });
      if (!userRows || userRows.length === 0) return res.status(401).json({ error: 'User not found' });

      db.query('INSERT INTO gem_purchases (user_id, description, amount, date, vendor) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, safeDesc, amt, safeDate, safeVendor], (insErr, result) => {
        if (insErr) {
          // Cleanup files if DB insert fails
          files.forEach(f => { try { if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path); } catch(_){} });
          return res.status(500).json({ error: insErr.message });
        }
        const purchaseId = result.insertId;

        // Insert inventory item (explicitly set status to 'available')
        db.query('INSERT INTO gem_inventory (user_id, gem_name, weight, color, clarity, cut, shape, origin, purchase_price, current_value, quantity, purchase_id, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)',
          [req.user.id, safeGemName, wt, safeColor, safeClarity, safeCut, safeShape, safeOrigin, amt, amt, purchaseId, safeDesc, 'available'], (invErr, invResult) => {
          if (invErr) {
            // Cleanup files if inventory insert fails
            files.forEach(f => { try { if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path); } catch(_){} });
            return res.status(500).json({ error: 'Failed to create inventory item: ' + invErr.message });
          }
          const inventoryId = invResult.insertId;

          if (!files || files.length === 0) {
            return res.status(201).json({ 
              id: purchaseId, 
              user_id: req.user.id, 
              description: safeDesc, 
              amount: amt, 
              date: safeDate, 
              vendor: safeVendor, 
              images: [],
              inventory_id: inventoryId
            });
          }
          const values = files.map(f => [inventoryId, f.filename, f.originalname, f.size, f.mimetype]);
          db.query(
            'INSERT INTO gem_inventory_images (inventory_id, file_name, original_name, file_size, mime_type) VALUES ?',
            [values],
            (imgErr) => {
              if (imgErr) return res.status(500).json({ error: imgErr.message });
              const images = files.map(f => ({
                file_name: f.filename,
                original_name: f.originalname,
                file_size: f.size,
                mime_type: f.mimetype,
                url: `/uploads/${f.filename}`
              }));
              res.status(201).json({ 
                id: purchaseId, 
                user_id: req.user.id, 
                description: safeDesc, 
                amount: amt, 
                date: safeDate, 
                vendor: safeVendor, 
                images,
                inventory_id: inventoryId
              });
            }
          );
        });
      });
    });
  } catch (err) {
    // Cleanup uploaded files if something went wrong before insert
    try {
      const files = req.files || [];
      files.forEach(f => { if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path); });
    } catch(_){}
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.get('/api/project-documents', authenticateToken, async (req, res) => {
  const db = await dbPromise;
  const userId = req.user.id;

  try {
    db.query('SELECT * FROM project_documents WHERE user_id = ? ORDER BY uploaded_at DESC', [userId], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.post('/api/project-documents', authenticateToken, upload.single('file'), async (req, res) => {
  const db = await dbPromise;
  const userId = req.user.id;
  const { project_id, description } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (!project_id) {
    return res.status(400).json({ error: 'Project ID is required' });
  }

  try {
    db.query(
      'INSERT INTO project_documents (user_id, project_id, file_name, original_name, description, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, project_id, file.filename, file.originalname, description || '', file.size, file.mimetype],
      (err, result) => {
        if (err) {
          // Clean up uploaded file if database insert fails
          fs.unlinkSync(file.path);
          return res.status(500).json({ error: err.message });
        }

        res.status(201).json({
          id: result.insertId,
          user_id: userId,
          project_id: parseInt(project_id),
          file_name: file.filename,
          original_name: file.originalname,
          description: description || '',
          file_size: file.size,
          mime_type: file.mimetype,
          uploaded_at: new Date()
        });
      }
    );
  } catch (err) {
    // Clean up uploaded file if error occurs
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.get('/api/project-documents/:id/download', authenticateToken, async (req, res) => {
  const db = await dbPromise;
  const userId = req.user.id;
  const documentId = req.params.id;

  try {
    // First verify the document belongs to the user
    db.query('SELECT * FROM project_documents WHERE id = ? AND user_id = ?', [documentId, userId], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(404).json({ error: 'Document not found' });

      const document = results[0];
      const filePath = path.join(__dirname, 'uploads', document.file_name);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found on server' });
      }

      // Set appropriate headers
      res.setHeader('Content-Type', document.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${document.original_name}"`);

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('error', (error) => {
        console.error('Error streaming file:', error);
        res.status(500).json({ error: 'Error downloading file' });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.delete('/api/project-documents/:id', authenticateToken, async (req, res) => {
  const db = await dbPromise;
  const userId = req.user.id;
  const documentId = req.params.id;

  try {
    // First get document details to delete the file
    db.query('SELECT file_name FROM project_documents WHERE id = ? AND user_id = ?', [documentId, userId], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(404).json({ error: 'Document not found' });

      const document = results[0];

      // Delete from database
      db.query('DELETE FROM project_documents WHERE id = ? AND user_id = ?', [documentId, userId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Document not found' });

        // Delete the file from filesystem
        const filePath = path.join(__dirname, 'uploads', document.file_name);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (fileErr) {
            console.error('Error deleting file:', fileErr);
            // Don't return error for file deletion failure
          }
        }

        res.json({ success: true });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});

// Gem Business: Sales - list
app.get('/api/gem/sales', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    db.query(
      `SELECT s.*, i.gem_name, i.weight, i.color, i.clarity, i.shape, i.origin
       FROM gem_sales s
       JOIN gem_inventory i ON s.inventory_id = i.id
       WHERE s.user_id = ?
       ORDER BY s.date DESC, s.created_at DESC`,
      [req.user.id],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rows || rows.length === 0) return res.json([]);
        const inventoryIds = rows.map(r => r.inventory_id);
        db.query('SELECT * FROM gem_inventory_images WHERE inventory_id IN (?)', [inventoryIds], (imgErr, images) => {
          if (imgErr) return res.status(500).json({ error: imgErr.message });
          const grouped = images.reduce((acc, img) => {
            acc[img.inventory_id] = acc[img.inventory_id] || [];
            acc[img.inventory_id].push({
              id: img.id,
              file_name: img.file_name,
              original_name: img.original_name,
              url: `/uploads/${img.file_name}`
            });
            return acc;
          }, {});
          const result = rows.map(r => ({
            ...r,
            images: grouped[r.inventory_id] || []
          }));
          res.json(result);
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});

// Gem Business: Sales - create
app.post('/api/gem/sales', authenticateToken, async (req, res) => {
  try {
    const db = await dbPromise;
    const { inventory_id, amount, date, buyer, description } = req.body;
    const invId = Number(inventory_id);
    const amt = Number(amount);
    if (!Number.isFinite(invId) || invId <= 0) return res.status(400).json({ error: 'Invalid inventory item' });
    if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: 'Amount must be positive' });
    const safeDate = (typeof date === 'string' && date.trim()) ? date.trim() : new Date().toISOString().slice(0,10);
    const safeBuyer = typeof buyer === 'string' ? buyer.trim() : null;
    const safeDesc = typeof description === 'string' ? description.trim() : '';

    // Ensure inventory item belongs to user and is available
    db.query('SELECT id, user_id, status FROM gem_inventory WHERE id = ?', [invId], (invErr, invRows) => {
      if (invErr) return res.status(500).json({ error: invErr.message });
      if (!invRows || invRows.length === 0) return res.status(404).json({ error: 'Inventory item not found' });
      const item = invRows[0];
      if (item.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
      if (item.status !== 'available') return res.status(400).json({ error: 'Item is not available for sale' });

      // Insert sale
      db.query('INSERT INTO gem_sales (user_id, inventory_id, description, amount, date, buyer) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, invId, safeDesc, amt, safeDate, safeBuyer], (saleErr, saleRes) => {
        if (saleErr) return res.status(500).json({ error: saleErr.message });
        const saleId = saleRes.insertId;
        // Update inventory status and current_value
        db.query('UPDATE gem_inventory SET status = \'sold\', current_value = ? WHERE id = ?', [amt, invId], (updErr) => {
          if (updErr) return res.status(500).json({ error: updErr.message });
          res.status(201).json({ id: saleId, inventory_id: invId, amount: amt, date: safeDate, buyer: safeBuyer, description: safeDesc });
        });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Database not ready' });
  }
});