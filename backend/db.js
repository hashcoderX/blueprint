const mysql = require('mysql2');

// Create connection without database to create it if needed
const tempConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  multipleStatements: true
});

tempConnection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }

  // Create database if it doesn't exist
  tempConnection.query('CREATE DATABASE IF NOT EXISTS blueprint', (err) => {
    if (err) {
      console.error('Error creating database:', err);
      tempConnection.end();
      return;
    }

    console.log('Database blueprint created or already exists');

    // Now create the main connection with the database
    const connection = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'blueprint',
      multipleStatements: true,
      // Ensure DECIMAL fields are returned as Numbers
      decimalNumbers: true,
      supportBigNumbers: true
    });

    connection.connect((err) => {
      if (err) {
        console.error('Error connecting to blueprint database:', err);
        return;
      }
      console.log('Connected to MySQL database blueprint');

      // Create tables if they don't exist
      const createTables = `
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          fullname VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          phone VARCHAR(20) UNIQUE,
          address TEXT,
          country VARCHAR(100),
          currency VARCHAR(10) DEFAULT 'USD',
          job_type ENUM('freelancer', 'businessman', 'software_engineer', 'employee') DEFAULT NULL,
          job_subcategory VARCHAR(100) DEFAULT NULL,
          password VARCHAR(255) NOT NULL,
          role ENUM('super_admin', 'admin', 'user') DEFAULT 'user',
          status ENUM('active', 'inactive') DEFAULT 'active',
          is_paid BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS expenses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          description VARCHAR(255) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          date DATE NOT NULL,
          category VARCHAR(50) DEFAULT 'general',
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS income (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          description VARCHAR(255) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          date DATE NOT NULL,
          category VARCHAR(50) DEFAULT 'salary',
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS goals (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(50) DEFAULT 'general',
          current DECIMAL(10,2) DEFAULT 0,
          target DECIMAL(10,2) NOT NULL,
          target_date DATE,
          priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
          status ENUM('active', 'completed', 'paused', 'cancelled') DEFAULT 'active',
          progress_percentage DECIMAL(5,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          completed_at TIMESTAMP NULL,
          notes TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS achievements (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          icon VARCHAR(50) NOT NULL,
          category VARCHAR(50) NOT NULL,
          requirement TEXT NOT NULL,
          reward VARCHAR(100) NOT NULL,
          progress INT DEFAULT 0,
          max_progress INT NOT NULL,
          unlocked BOOLEAN DEFAULT FALSE,
          unlocked_date TIMESTAMP NULL,
          rarity ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS tasks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          title VARCHAR(255) NOT NULL,
          status ENUM('todo', 'inProgress', 'done') DEFAULT 'todo',
          priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
          category VARCHAR(50) DEFAULT 'general',
          planned_date DATE NULL,
          allocated_hours DECIMAL(6,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS task_time_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          task_id INT NOT NULL,
          start_time DATETIME NOT NULL,
          end_time DATETIME NULL,
          duration_minutes INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (task_id) REFERENCES tasks(id)
        );

        CREATE TABLE IF NOT EXISTS vehicle_expenses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          description VARCHAR(255) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          date DATE NOT NULL,
          vehicle VARCHAR(255) NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS vehicles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          make VARCHAR(100),
          model VARCHAR(100),
          year INT,
          vehicle_no VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS notes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          content TEXT,
          date DATE NOT NULL,
          mood VARCHAR(50),
          one_sentence VARCHAR(255),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS payment_methods (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          payment_type ENUM('credit_card', 'debit_card', 'paypal', 'bank_transfer') NOT NULL,
          card_type ENUM('visa', 'mastercard', 'amex', 'discover') NULL,
          last_four VARCHAR(4) NULL,
          expiry_month TINYINT NULL,
          expiry_year SMALLINT NULL,
          encrypted_card_number TEXT NULL,
          billing_address TEXT,
          is_default BOOLEAN DEFAULT FALSE,
          status ENUM('active', 'expired', 'suspended') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS subscriptions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          plan_name VARCHAR(100) NOT NULL,
          plan_type ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'free',
          status ENUM('active', 'inactive', 'cancelled', 'past_due') DEFAULT 'active',
          amount DECIMAL(10,2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'USD',
          billing_cycle ENUM('monthly', 'yearly') DEFAULT 'monthly',
          current_period_start DATE NOT NULL,
          current_period_end DATE NOT NULL,
          trial_end DATE NULL,
          cancel_at_period_end BOOLEAN DEFAULT FALSE,
          payment_method_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
        );

        CREATE TABLE IF NOT EXISTS password_entries (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          platform VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          username VARCHAR(255),
          encrypted_password TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS api_keys (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          api_key TEXT NOT NULL,
          api_secret TEXT,
          project_name VARCHAR(255) NOT NULL,
          provider VARCHAR(255),
          environment ENUM('development', 'staging', 'production') DEFAULT 'development',
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS projects (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          status ENUM('planning', 'active', 'on-hold', 'completed') DEFAULT 'planning',
          budget DECIMAL(10,2) DEFAULT 0,
          spent DECIMAL(10,2) DEFAULT 0,
          start_date DATE,
          end_date DATE,
          client_name VARCHAR(255),
          priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
          total_time_spent INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS project_time_entries (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          project_id INT NOT NULL,
          description VARCHAR(255),
          start_time DATETIME NOT NULL,
          end_time DATETIME NULL,
          duration INT DEFAULT 0,
          is_running BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS project_purchases (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          project_id INT NOT NULL,
          item_name VARCHAR(255) NOT NULL,
          cost DECIMAL(10,2) NOT NULL,
          category VARCHAR(100),
          vendor VARCHAR(255),
          date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS project_income (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          project_id INT NOT NULL,
          description VARCHAR(255) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          category VARCHAR(100) DEFAULT 'project_revenue',
          date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        -- Gem Business: Purchases and Inventory tables
        CREATE TABLE IF NOT EXISTS gem_purchases (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          description TEXT,
          amount DECIMAL(10,2) NOT NULL,
          date DATE NOT NULL,
          vendor VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS gem_purchase_images (
          id INT AUTO_INCREMENT PRIMARY KEY,
          purchase_id INT NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          original_name VARCHAR(255) NOT NULL,
          file_size BIGINT NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (purchase_id) REFERENCES gem_purchases(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS gem_inventory (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          gem_name VARCHAR(255) NOT NULL,
          weight DECIMAL(10,3) NOT NULL,
          color VARCHAR(100),
          clarity VARCHAR(100),
          cut VARCHAR(100),
          shape VARCHAR(100),
          origin VARCHAR(255),
          purchase_price DECIMAL(10,2) NOT NULL,
          current_value DECIMAL(10,2),
          quantity INT DEFAULT 1,
          purchase_id INT,
          description TEXT,
          status ENUM('available', 'sold', 'reserved') DEFAULT 'available',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (purchase_id) REFERENCES gem_purchases(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS gem_inventory_images (
          id INT AUTO_INCREMENT PRIMARY KEY,
          inventory_id INT NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          original_name VARCHAR(255) NOT NULL,
          file_size BIGINT NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (inventory_id) REFERENCES gem_inventory(id) ON DELETE CASCADE
        );
      `;

      connection.query(createTables, (err) => {
        if (err) {
          console.error('Error creating tables:', err);
        } else {
          console.log('Tables created or already exist');

          // Add category column to expenses table if it doesn't exist
          const alterExpensesTable = `
            ALTER TABLE expenses 
            ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general';
          `;

          connection.query(alterExpensesTable, (alterErr) => {
            if (alterErr) {
              console.error('Error altering expenses table:', alterErr);
            } else {
              console.log('Expenses table altered successfully');
            }
          });

          // Ensure new planning/time fields exist on tasks
          const alterTasksTable = `
            ALTER TABLE tasks 
              ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general',
              ADD COLUMN IF NOT EXISTS planned_date DATE NULL,
              ADD COLUMN IF NOT EXISTS allocated_hours DECIMAL(6,2) DEFAULT 0,
              ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
          `;

          connection.query(alterTasksTable, (alterTasksErr) => {
            if (alterTasksErr) {
              console.error('Error altering tasks table:', alterTasksErr);
            } else {
              console.log('Tasks table altered successfully');
            }
          });

          // Add vehicle_no column to vehicles table if it doesn't exist
          const alterVehiclesTable = `
            ALTER TABLE vehicles 
            ADD COLUMN IF NOT EXISTS vehicle_no VARCHAR(50);
          `;

          connection.query(alterVehiclesTable, (alterVehiclesErr) => {
            if (alterVehiclesErr) {
              console.error('Error altering vehicles table:', alterVehiclesErr);
            } else {
              console.log('Vehicles table altered successfully');
            }
          });

          // Ensure task_time_logs table exists
          const ensureLogsTable = `
            CREATE TABLE IF NOT EXISTS task_time_logs (
              id INT AUTO_INCREMENT PRIMARY KEY,
              user_id INT NOT NULL,
              task_id INT NOT NULL,
              start_time DATETIME NOT NULL,
              end_time DATETIME NULL,
              duration_minutes INT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id),
              FOREIGN KEY (task_id) REFERENCES tasks(id)
            );
          `;

          connection.query(ensureLogsTable, (logsErr) => {
            if (logsErr) {
              console.error('Error ensuring task_time_logs table:', logsErr);
            } else {
              console.log('task_time_logs table ensured');
            }
          });

          // Ensure notes table has required columns for diary
          const alterNotesTable = `
            ALTER TABLE notes 
              ADD COLUMN IF NOT EXISTS user_id INT NOT NULL DEFAULT 1,
              ADD COLUMN IF NOT EXISTS mood VARCHAR(50),
              ADD COLUMN IF NOT EXISTS one_sentence VARCHAR(255);
          `;

          connection.query(alterNotesTable, (alterNotesErr) => {
            if (alterNotesErr) {
              console.error('Error altering notes table:', alterNotesErr);
            } else {
              console.log('Notes table altered successfully');
            }
          });

          // Insert sample data if tables are empty
          const insertSampleData = `
            INSERT IGNORE INTO users (id, username, fullname, email, phone, address, country, currency, password, role, status, is_paid) VALUES
            (1, 'superadmin', 'Super Admin', 'admin@blueprint.com', '1234567890', 'Admin Address', 'United States', 'USD', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', 'active', TRUE);

            INSERT IGNORE INTO expenses (id, user_id, description, amount, date) VALUES
            (1, 1, 'Groceries', 150.00, '2023-10-01'),
            (2, 1, 'Gas', 50.00, '2023-10-02'),
            (3, 1, 'Utilities', 200.00, '2023-10-03');

            INSERT IGNORE INTO goals (id, user_id, name, description, category, current, target, target_date, priority, status, progress_percentage, notes) VALUES
            (1, 1, 'Emergency Fund', 'Build a 6-month emergency fund for financial security', 'Savings', 5000.00, 10000.00, '2024-12-31', 'high', 'active', 50.00, 'Monthly contributions of $500'),
            (2, 1, 'Vacation Fund', 'Save for a dream vacation to Europe', 'Vacation', 2000.00, 5000.00, '2024-06-15', 'medium', 'active', 40.00, 'Need to increase monthly savings'),
            (3, 1, 'New Car Purchase', 'Save for a reliable family vehicle', 'Car', 15000.00, 30000.00, '2025-03-01', 'medium', 'active', 50.00, 'Down payment goal'),
            (4, 1, 'Home Down Payment', 'Save 20% down payment for first home', 'Home', 25000.00, 50000.00, '2025-12-31', 'high', 'active', 50.00, 'Working with real estate agent'),
            (5, 1, 'Retirement Fund', 'Build retirement savings for future security', 'Investment', 50000.00, 200000.00, '2045-01-01', 'high', 'active', 25.00, 'Max out 401k contributions'),
            (6, 1, 'Education Fund', 'Save for children''s college education', 'Education', 10000.00, 100000.00, '2035-08-01', 'medium', 'active', 10.00, '529 plan contributions');

            INSERT IGNORE INTO achievements (id, user_id, title, description, icon, category, requirement, reward, progress, max_progress, unlocked, unlocked_date, rarity) VALUES
            (1, 1, 'First Savings', 'Save your first $100', 'PiggyBank', 'Savings', 'Save $100 total', '100 points', 100, 100, TRUE, '2024-01-10', 'common'),
            (2, 1, 'Savings Champion', 'Save $10,000 in total', 'PiggyBank', 'Savings', 'Save $10,000 total', '500 points', 7500, 10000, FALSE, NULL, 'epic'),
            (3, 1, 'Emergency Fund', 'Build a 6-month emergency fund', 'PiggyBank', 'Savings', 'Save 6 months of expenses', '1000 points', 3, 6, FALSE, NULL, 'legendary'),
            (4, 1, 'Budget Master', 'Stay under budget for 30 days', 'DollarSign', 'Expenses', '30 consecutive days under budget', '200 points', 15, 30, FALSE, NULL, 'rare'),
            (5, 1, 'Expense Tracker', 'Track 100 expenses', 'DollarSign', 'Expenses', 'Record 100 expenses', '150 points', 100, 100, TRUE, '2024-01-08', 'common'),
            (6, 1, 'Goal Setter', 'Create your first financial goal', 'Target', 'Goals', 'Create 1 goal', '50 points', 1, 1, TRUE, '2024-01-05', 'common'),
            (7, 1, 'Goal Crusher', 'Complete 10 financial goals', 'Target', 'Goals', 'Complete 10 goals', '300 points', 7, 10, FALSE, NULL, 'epic'),
            (8, 1, 'Task Master', 'Complete 50 tasks', 'CheckSquare', 'Tasks', 'Complete 50 tasks', '250 points', 42, 50, FALSE, NULL, 'rare'),
            (9, 1, 'Fuel Efficient', 'Track fuel expenses for 6 months', 'Car', 'Vehicle', '6 months of fuel tracking', '200 points', 4, 6, FALSE, NULL, 'rare'),
            (10, 1, 'Health Conscious', 'Track health-related expenses', 'Heart', 'Lifestyle', 'Record 20 health expenses', '150 points', 12, 20, FALSE, NULL, 'common'),
            (11, 1, 'Social Butterfly', 'Share achievements with friends', 'Users', 'Social', 'Share 5 achievements', '100 points', 2, 5, FALSE, NULL, 'common'),
            (12, 1, 'Financial Scholar', 'Complete financial education modules', 'BookOpen', 'Learning', 'Complete 10 learning modules', '300 points', 6, 10, FALSE, NULL, 'epic');

            INSERT IGNORE INTO tasks (id, user_id, title, status, priority, category, planned_date, allocated_hours) VALUES
            (1, 1, 'Review budget', 'todo', 'high', 'job', CURRENT_DATE, 2.00),
            (2, 1, 'Plan meal prep', 'todo', 'medium', 'personal', CURRENT_DATE, 1.00),
            (3, 1, 'Update expense tracker', 'inProgress', 'high', 'job', CURRENT_DATE, 1.50),
            (4, 1, 'Pay bills', 'done', 'low', 'personal', CURRENT_DATE, 0.50),
            (5, 1, 'Check savings account', 'done', 'medium', 'job', CURRENT_DATE, 0.25);

            INSERT IGNORE INTO vehicle_expenses (id, user_id, description, amount, date, vehicle) VALUES
            (1, 1, 'Fuel', 60.00, '2023-10-01', 'Toyota Camry'),
            (2, 1, 'Maintenance', 150.00, '2023-10-05', 'Toyota Camry'),
            (3, 1, 'Insurance', 120.00, '2023-10-10', 'Honda Civic');

            INSERT IGNORE INTO notes (id, user_id, title, content, date) VALUES
            (1, 1, 'Weekly Reflection', 'This week was productive...', '2023-10-01'),
            (2, 1, 'Budget Notes', 'Remember to save for vacation...', '2023-10-02');

            INSERT IGNORE INTO payment_methods (id, user_id, payment_type, card_type, last_four, expiry_month, expiry_year, billing_address, is_default, status) VALUES
            (1, 1, 'credit_card', 'visa', '4242', 12, 2026, 'Admin Address, United States', TRUE, 'active');

            INSERT IGNORE INTO subscriptions (id, user_id, plan_name, plan_type, status, amount, currency, billing_cycle, current_period_start, current_period_end, payment_method_id) VALUES
            (1, 1, 'Premium Plan', 'premium', 'active', 29.99, 'USD', 'monthly', '2024-01-01', '2024-01-31', 1);
          `;

          connection.query(insertSampleData, (err) => {
            if (err) {
              console.error('Error inserting sample data:', err);
            } else {
              console.log('Sample data inserted');
            }
          });
        }
      });
    });

    tempConnection.end();
  });
});

module.exports = new Promise((resolve, reject) => {
  // Wait for connection to be established
  setTimeout(() => {
    const conn = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'blueprint',
      multipleStatements: true
    });
    conn.connect((err) => {
      if (err) {
        console.error('Failed to connect to database:', err.message);
        reject(err);
      } else {
        console.log('Connected to MySQL database blueprint');
        resolve(conn);
      }
    });
  }, 2000); // Wait 2 seconds for setup
});