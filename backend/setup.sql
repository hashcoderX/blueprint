-- Create database
CREATE DATABASE IF NOT EXISTS blueprint;

-- Use database
USE blueprint;

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL
);

-- Income table
CREATE TABLE IF NOT EXISTS income (
  id INT AUTO_INCREMENT PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  category VARCHAR(50) DEFAULT 'salary'
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  current DECIMAL(10,2) NOT NULL,
  target DECIMAL(10,2) NOT NULL
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  status ENUM('todo', 'inProgress', 'done') DEFAULT 'todo',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium'
);

-- Vehicle Expenses table
CREATE TABLE IF NOT EXISTS vehicle_expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  vehicle VARCHAR(255) NOT NULL
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  make VARCHAR(100),
  model VARCHAR(100),
  year INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Password Vault table
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

-- Notes table
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

-- Migrate notes table: add missing columns if not exist
ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id INT NOT NULL DEFAULT 1;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS mood VARCHAR(50);
ALTER TABLE notes ADD COLUMN IF NOT EXISTS one_sentence VARCHAR(255);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  budget DECIMAL(10,2) DEFAULT 0,
  spent DECIMAL(10,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  client_name VARCHAR(255),
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  status ENUM('planning', 'active', 'on-hold', 'completed') DEFAULT 'planning',
  total_time_spent INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Project Purchases table
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

-- Project Income table
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

-- Project Time Entries table
CREATE TABLE IF NOT EXISTS project_time_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  project_id INT NOT NULL,
  description VARCHAR(255),
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  duration INT, -- in minutes
  is_running BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Project Documents table
CREATE TABLE IF NOT EXISTS project_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  project_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  description TEXT,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Insert sample data
INSERT INTO expenses (description, amount, date) VALUES
('Groceries', 150.00, '2023-10-01'),
('Gas', 50.00, '2023-10-02'),
('Utilities', 200.00, '2023-10-03');

INSERT INTO income (description, amount, date, category) VALUES
('Monthly Salary', 3500.00, '2023-10-01', 'salary'),
('Freelance Project', 800.00, '2023-10-15', 'freelance'),
('Investment Dividend', 150.00, '2023-10-20', 'investment');

INSERT INTO goals (name, current, target) VALUES
('Emergency Fund', 5000.00, 10000.00),
('Vacation', 2000.00, 5000.00),
('New Car', 15000.00, 30000.00),
('Home Down Payment', 25000.00, 50000.00);

INSERT INTO tasks (title, status, priority) VALUES
('Review budget', 'todo', 'high'),
('Plan meal prep', 'todo', 'medium'),
('Update expense tracker', 'inProgress', 'high'),
('Pay bills', 'done', 'low'),
('Check savings account', 'done', 'medium');

INSERT INTO vehicle_expenses (description, amount, date, vehicle) VALUES
('Fuel', 60.00, '2023-10-01', 'Toyota Camry'),
('Maintenance', 150.00, '2023-10-05', 'Toyota Camry'),
('Insurance', 120.00, '2023-10-10', 'Honda Civic');

INSERT INTO notes (title, content, date) VALUES
('Weekly Reflection', 'This week was productive...', '2023-10-01'),
('Budget Notes', 'Remember to save for vacation...', '2023-10-02');