-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 08, 2026 at 09:35 AM
-- Server version: 10.4.27-MariaDB
-- PHP Version: 8.2.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `blueprint`
--

-- --------------------------------------------------------

--
-- Table structure for table `achievements`
--

CREATE TABLE `achievements` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(50) NOT NULL,
  `category` varchar(50) NOT NULL,
  `requirement` text NOT NULL,
  `reward` varchar(100) NOT NULL,
  `progress` int(11) DEFAULT 0,
  `max_progress` int(11) NOT NULL,
  `unlocked` tinyint(1) DEFAULT 0,
  `unlocked_date` timestamp NULL DEFAULT NULL,
  `rarity` enum('common','rare','epic','legendary') DEFAULT 'common',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `achievements`
--

INSERT INTO `achievements` (`id`, `user_id`, `title`, `description`, `icon`, `category`, `requirement`, `reward`, `progress`, `max_progress`, `unlocked`, `unlocked_date`, `rarity`, `created_at`, `updated_at`) VALUES
(1, 1, 'First Savings', 'Save your first $100', 'PiggyBank', 'Savings', 'Save $100 total', '100 points', 100, 100, 1, '2024-01-09 18:30:00', 'common', '2026-02-08 05:43:03', '2026-02-08 05:43:03'),
(2, 1, 'Savings Champion', 'Save $10,000 in total', 'PiggyBank', 'Savings', 'Save $10,000 total', '500 points', 7500, 10000, 0, NULL, 'epic', '2026-02-08 05:43:03', '2026-02-08 05:43:03'),
(3, 1, 'Emergency Fund', 'Build a 6-month emergency fund', 'PiggyBank', 'Savings', 'Save 6 months of expenses', '1000 points', 3, 6, 0, NULL, 'legendary', '2026-02-08 05:43:03', '2026-02-08 05:43:03'),
(4, 1, 'Budget Master', 'Stay under budget for 30 days', 'DollarSign', 'Expenses', '30 consecutive days under budget', '200 points', 15, 30, 0, NULL, 'rare', '2026-02-08 05:43:03', '2026-02-08 05:43:03'),
(5, 1, 'Expense Tracker', 'Track 100 expenses', 'DollarSign', 'Expenses', 'Record 100 expenses', '150 points', 100, 100, 1, '2024-01-07 18:30:00', 'common', '2026-02-08 05:43:03', '2026-02-08 05:43:03'),
(6, 1, 'Goal Setter', 'Create your first financial goal', 'Target', 'Goals', 'Create 1 goal', '50 points', 1, 1, 1, '2024-01-04 18:30:00', 'common', '2026-02-08 05:43:03', '2026-02-08 05:43:03'),
(7, 1, 'Goal Crusher', 'Complete 10 financial goals', 'Target', 'Goals', 'Complete 10 goals', '300 points', 7, 10, 0, NULL, 'epic', '2026-02-08 05:43:03', '2026-02-08 05:43:03'),
(8, 1, 'Task Master', 'Complete 50 tasks', 'CheckSquare', 'Tasks', 'Complete 50 tasks', '250 points', 42, 50, 0, NULL, 'rare', '2026-02-08 05:43:03', '2026-02-08 05:43:03'),
(9, 1, 'Fuel Efficient', 'Track fuel expenses for 6 months', 'Car', 'Vehicle', '6 months of fuel tracking', '200 points', 4, 6, 0, NULL, 'rare', '2026-02-08 05:43:03', '2026-02-08 05:43:03'),
(10, 1, 'Health Conscious', 'Track health-related expenses', 'Heart', 'Lifestyle', 'Record 20 health expenses', '150 points', 12, 20, 0, NULL, 'common', '2026-02-08 05:43:03', '2026-02-08 05:43:03'),
(11, 1, 'Social Butterfly', 'Share achievements with friends', 'Users', 'Social', 'Share 5 achievements', '100 points', 2, 5, 0, NULL, 'common', '2026-02-08 05:43:03', '2026-02-08 05:43:03'),
(12, 1, 'Financial Scholar', 'Complete financial education modules', 'BookOpen', 'Learning', 'Complete 10 learning modules', '300 points', 6, 10, 0, NULL, 'epic', '2026-02-08 05:43:03', '2026-02-08 05:43:03');

-- --------------------------------------------------------

--
-- Table structure for table `api_keys`
--

CREATE TABLE `api_keys` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `api_key` text NOT NULL,
  `api_secret` text DEFAULT NULL,
  `project_name` varchar(255) NOT NULL,
  `provider` varchar(255) DEFAULT NULL,
  `environment` enum('development','staging','production') DEFAULT 'development',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `businesses`
--

CREATE TABLE `businesses` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `business_name` varchar(255) NOT NULL,
  `registration_no` varchar(100) DEFAULT NULL,
  `tax_id` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `currency` varchar(10) DEFAULT 'USD',
  `owner_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `date` date NOT NULL,
  `category` varchar(50) DEFAULT 'general'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `expenses`
--

INSERT INTO `expenses` (`id`, `user_id`, `description`, `amount`, `date`, `category`) VALUES
(1, 1, 'Groceries', '150.00', '2023-10-01', 'general'),
(2, 1, 'Gas', '50.00', '2023-10-02', 'general'),
(3, 1, 'Utilities', '200.00', '2023-10-03', 'general');

-- --------------------------------------------------------

--
-- Table structure for table `gem_expenses`
--

CREATE TABLE `gem_expenses` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `inventory_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `date` date NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gem_inventory`
--

CREATE TABLE `gem_inventory` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `gem_name` varchar(255) NOT NULL,
  `weight` decimal(10,3) NOT NULL,
  `color` varchar(100) DEFAULT NULL,
  `clarity` varchar(100) DEFAULT NULL,
  `cut` varchar(100) DEFAULT NULL,
  `shape` varchar(100) DEFAULT NULL,
  `origin` varchar(255) DEFAULT NULL,
  `purchase_price` decimal(10,2) NOT NULL,
  `current_value` decimal(10,2) DEFAULT NULL,
  `quantity` int(11) DEFAULT 1,
  `purchase_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('available','sold','reserved') DEFAULT 'available',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `gem_inventory`
--

INSERT INTO `gem_inventory` (`id`, `user_id`, `gem_name`, `weight`, `color`, `clarity`, `cut`, `shape`, `origin`, `purchase_price`, `current_value`, `quantity`, `purchase_id`, `description`, `status`, `created_at`, `updated_at`) VALUES
(3, 12, 'Blue Sapphire', '5.000', 'Vivid Blue', 'Eye Clean', 'Round', 'NO', 'Balangoda', '250000.00', '200000.00', 1, 4, 'Blue Sapphire 10ct', 'sold', '2026-02-01 08:14:49', '2026-02-01 09:38:20'),
(4, 12, 'Moon Stone', '10.000', 'White', 'Clean', 'No', 'No', 'Sri Lanka', '20000.00', '450000.00', 1, 5, '10ct Moon Stone', 'sold', '2026-02-01 09:43:17', '2026-02-01 10:09:18');

-- --------------------------------------------------------

--
-- Table structure for table `gem_inventory_images`
--

CREATE TABLE `gem_inventory_images` (
  `id` int(11) NOT NULL,
  `inventory_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_size` bigint(20) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gem_inventory_tracking`
--

CREATE TABLE `gem_inventory_tracking` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `inventory_id` int(11) NOT NULL,
  `action_type` enum('burning','broker','note') NOT NULL,
  `party` varchar(255) DEFAULT NULL,
  `status` enum('ongoing','completed') DEFAULT 'ongoing',
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gem_purchases`
--

CREATE TABLE `gem_purchases` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `date` date NOT NULL,
  `vendor` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `gem_purchases`
--

INSERT INTO `gem_purchases` (`id`, `user_id`, `description`, `amount`, `date`, `vendor`, `created_at`, `updated_at`) VALUES
(4, 12, 'Blue Sapphire 10ct', '250000.00', '2026-02-01', 'Lional Gems', '2026-02-01 08:14:49', '2026-02-01 08:14:49'),
(5, 12, '10ct Moon Stone', '20000.00', '2026-02-01', 'Saman', '2026-02-01 09:43:17', '2026-02-01 09:43:17');

-- --------------------------------------------------------

--
-- Table structure for table `gem_purchase_images`
--

CREATE TABLE `gem_purchase_images` (
  `id` int(11) NOT NULL,
  `purchase_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_size` bigint(20) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gem_sales`
--

CREATE TABLE `gem_sales` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `inventory_id` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `date` date NOT NULL,
  `buyer` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `gem_sales`
--

INSERT INTO `gem_sales` (`id`, `user_id`, `inventory_id`, `description`, `amount`, `date`, `buyer`, `created_at`) VALUES
(2, 12, 3, 'Sold In Ratnapura Gem Market', '200000.00', '2026-02-01', 'Somathilaka', '2026-02-01 09:38:20'),
(3, 12, 4, 'asd', '450000.00', '2026-02-01', 'Jayanath haji', '2026-02-01 10:09:18');

-- --------------------------------------------------------

--
-- Table structure for table `goals`
--

CREATE TABLE `goals` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(50) DEFAULT 'general',
  `current` decimal(10,2) DEFAULT 0.00,
  `target` decimal(10,2) NOT NULL,
  `target_date` date DEFAULT NULL,
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `status` enum('active','completed','paused','cancelled') DEFAULT 'active',
  `progress_percentage` decimal(5,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `goals`
--

INSERT INTO `goals` (`id`, `user_id`, `name`, `description`, `category`, `current`, `target`, `target_date`, `priority`, `status`, `progress_percentage`, `created_at`, `updated_at`, `completed_at`, `notes`) VALUES
(1, 1, 'Emergency Fund', 'Build a 6-month emergency fund for financial security', 'Savings', '5000.00', '10000.00', '2024-12-31', 'high', 'active', '50.00', '2026-02-05 08:29:57', '2026-02-05 08:29:57', NULL, 'Monthly contributions of $500'),
(2, 1, 'Vacation Fund', 'Save for a dream vacation to Europe', 'Vacation', '2000.00', '5000.00', '2024-06-15', 'medium', 'active', '40.00', '2026-02-05 08:29:57', '2026-02-05 08:29:57', NULL, 'Need to increase monthly savings'),
(3, 1, 'New Car Purchase', 'Save for a reliable family vehicle', 'Car', '15000.00', '30000.00', '2025-03-01', 'medium', 'active', '50.00', '2026-02-05 08:29:57', '2026-02-05 08:29:57', NULL, 'Down payment goal'),
(4, 1, 'Home Down Payment', 'Save 20% down payment for first home', 'Home', '25000.00', '50000.00', '2025-12-31', 'high', 'active', '50.00', '2026-02-05 08:29:57', '2026-02-05 08:29:57', NULL, 'Working with real estate agent'),
(5, 1, 'Retirement Fund', 'Build retirement savings for future security', 'Investment', '50000.00', '200000.00', '2045-01-01', 'high', 'active', '25.00', '2026-02-05 08:29:57', '2026-02-05 08:29:57', NULL, 'Max out 401k contributions'),
(6, 1, 'Education Fund', 'Save for children\'s college education', 'Education', '10000.00', '100000.00', '2035-08-01', 'medium', 'active', '10.00', '2026-02-05 08:29:57', '2026-02-05 08:29:57', NULL, '529 plan contributions'),
(11, 8, 'Create Emergency Fund', 'asdffsfd', 'Investment', '1000.00', '2000000.00', '2026-09-26', 'medium', 'active', '0.05', '2026-01-26 10:22:19', '2026-01-26 10:23:40', NULL, 'xv'),
(12, 12, 'Compleat My MS.c', 'i have to compleat Ms.c before 2027', 'Education', '50000.00', '600000.00', '2026-12-16', 'high', 'active', '8.33', '2026-01-26 18:27:34', '2026-01-26 18:33:58', NULL, 'g'),
(13, 12, 'Buy Lancer Car', 'Buy Lancer Car', 'Car', '200000.00', '40000000.00', '2026-07-04', 'high', 'active', '0.50', '2026-01-27 07:33:04', '2026-01-27 07:33:27', NULL, 'sdfsdf'),
(14, 14, 'Compleate MS.c', 'Complete Ms.c', 'Education', '30000.00', '60000.00', '2026-02-28', 'medium', 'active', '50.00', '2026-02-05 12:24:39', '2026-02-05 12:24:39', NULL, '');

-- --------------------------------------------------------

--
-- Table structure for table `income`
--

CREATE TABLE `income` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `date` date NOT NULL,
  `category` varchar(50) DEFAULT 'salary'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `income`
--

INSERT INTO `income` (`id`, `user_id`, `description`, `amount`, `date`, `category`) VALUES
(3, NULL, 'Monthly Salary', '3500.00', '2023-10-01', 'salary'),
(4, NULL, 'Freelance Project', '800.00', '2023-10-15', 'freelance'),
(5, NULL, 'Investment Dividend', '150.00', '2023-10-20', 'investment'),
(6, 8, 'Sallary', '60000.00', '2026-01-26', 'salary'),
(7, 12, 'Gemisetha Salary', '50000.00', '2026-01-27', 'salary');

-- --------------------------------------------------------

--
-- Table structure for table `notes`
--

CREATE TABLE `notes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `content` text DEFAULT NULL,
  `date` date NOT NULL,
  `mood` varchar(50) DEFAULT NULL,
  `one_sentence` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notes`
--

INSERT INTO `notes` (`id`, `user_id`, `title`, `content`, `date`, `mood`, `one_sentence`) VALUES
(1, 1, 'Weekly Reflection', 'This week was productive...', '2023-10-01', NULL, NULL),
(2, 1, 'Budget Notes', 'Remember to save for vacation...', '2026-02-04', 'storm', 'fhjkkll'),
(6, 2, 'Today', '', '2026-01-21', '', ''),
(7, 2, 'Today', 'i met super friend, so today is funny day', '2026-01-25', '', 'Today is good day'),
(8, NULL, 'Weekly Reflection', 'This week was productive...', '2023-10-01', NULL, NULL),
(9, NULL, 'Budget Notes', 'Remember to save for vacation...', '2023-10-02', NULL, NULL),
(10, 12, 'Today', '', '2026-02-03', 'sun', '');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `body`, `is_read`, `created_at`) VALUES
(1, 12, 'Blueprint', 'Push test notification', 1, '2026-02-03 05:55:42'),
(2, 12, 'Blueprint', 'Push test notification', 1, '2026-02-03 05:58:54'),
(3, 12, 'Blueprint', 'Push test notification', 1, '2026-02-03 06:34:31'),
(4, 12, 'Blueprint', 'Push test notification', 1, '2026-02-03 06:34:31'),
(5, 12, 'Task Reminder', 'You have 2 tasks scheduled today.', 1, '2026-02-03 06:48:18');

-- --------------------------------------------------------

--
-- Table structure for table `password_entries`
--

CREATE TABLE `password_entries` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `platform` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `encrypted_password` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `password_entries`
--

INSERT INTO `password_entries` (`id`, `user_id`, `platform`, `email`, `username`, `encrypted_password`, `notes`, `created_at`, `updated_at`) VALUES
(1, 2, 'Facebook', 'sudharma@gmail.com', 'sudharma1993', '+odKKg2A8dyoJ+gZwIijngv9lzt1YWMC1yETUYL7UIS4zmNk+L9PmTg=', 'asdasd', '2026-01-25 07:43:03', '2026-01-25 07:43:03');

-- --------------------------------------------------------

--
-- Table structure for table `payment_methods`
--

CREATE TABLE `payment_methods` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `payment_type` enum('credit_card','debit_card','paypal','bank_transfer') NOT NULL,
  `card_type` enum('visa','mastercard','amex','discover') DEFAULT NULL,
  `last_four` varchar(4) DEFAULT NULL,
  `expiry_month` tinyint(4) DEFAULT NULL,
  `expiry_year` smallint(6) DEFAULT NULL,
  `encrypted_card_number` text DEFAULT NULL,
  `billing_address` text DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `status` enum('active','expired','suspended') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment_methods`
--

INSERT INTO `payment_methods` (`id`, `user_id`, `payment_type`, `card_type`, `last_four`, `expiry_month`, `expiry_year`, `encrypted_card_number`, `billing_address`, `is_default`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'credit_card', 'visa', '4242', 12, 2026, NULL, 'Admin Address, United States', 1, 'active', '2026-01-20 06:21:09', '2026-01-20 06:21:09'),
(2, 14, '', 'visa', '6808', 2, 2029, 'mFRbnbPrPiw5Mu2xIfq0jsmWsmvRqk7+k0OkiOj9Dc4RyCVJjUgo1HhTZ5evnzo5Fppo', '465/P,Namaldeniya,Parakaduwa', 1, 'active', '2026-02-05 09:06:24', '2026-02-05 09:06:24'),
(3, 16, '', 'visa', '6808', 2, 2029, 'T3C7Akkulw+8oeFo+qD8L3kHKSobC6LhMTsXcx7Q4hOmn+YrDI4rWXMVyRBA+dJ792p/', 'Eheliyagoda, 70550', 1, 'active', '2026-02-05 09:25:57', '2026-02-05 09:25:57');

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('planning','active','on-hold','completed') DEFAULT 'planning',
  `budget` decimal(10,2) DEFAULT 0.00,
  `spent` decimal(10,2) DEFAULT 0.00,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `client_name` varchar(255) DEFAULT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `total_time_spent` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `user_id`, `name`, `description`, `status`, `budget`, `spent`, `start_date`, `end_date`, `client_name`, `priority`, `total_time_spent`, `created_at`, `updated_at`) VALUES
(1, 8, 'Hudson Marketing', 'Hudson marketing project, Destribution Managment', 'planning', '400000.00', '10000.00', '2026-01-25', '2026-09-18', 'Hudson Marketing Pvt Ltd', 'medium', 0, '2026-01-25 11:22:44', '2026-01-25 11:47:05'),
(2, 8, 'TD Micro Credit', 'TD micro Credit ', 'planning', '30000.00', '0.00', '2026-01-18', '2026-01-31', 'Tharidu', 'medium', 0, '2026-01-25 12:25:30', '2026-01-25 14:38:33'),
(3, 8, 'Dammika Project', 'POS system', 'planning', '170000.00', '4000.00', '2026-01-26', '2026-05-26', 'Dammaki Prabath', 'medium', 0, '2026-01-26 10:45:12', '2026-01-26 10:47:01'),
(4, 13, 'Building a Farm', 'Building a Farm', 'planning', '4000000.00', '40000.00', '2026-01-26', '2026-05-27', 'Sajith', 'low', 0, '2026-01-27 07:43:05', '2026-01-27 07:43:40');

-- --------------------------------------------------------

--
-- Table structure for table `project_documents`
--

CREATE TABLE `project_documents` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `file_size` bigint(20) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project_documents`
--

INSERT INTO `project_documents` (`id`, `user_id`, `project_id`, `file_name`, `original_name`, `description`, `file_size`, `mime_type`, `uploaded_at`) VALUES
(1, 8, 2, '1769402402773-116742826.png', 'Screenshot 2026-01-03 115523.png', 'ddfdf', 48096, 'image/png', '2026-01-26 04:40:02'),
(2, 8, 3, '1769424450324-519931509.png', 'Screenshot 2026-01-03 115523.png', 'asd', 48096, 'image/png', '2026-01-26 10:47:30');

-- --------------------------------------------------------

--
-- Table structure for table `project_income`
--

CREATE TABLE `project_income` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `category` varchar(100) DEFAULT 'project_revenue',
  `date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project_income`
--

INSERT INTO `project_income` (`id`, `user_id`, `project_id`, `description`, `amount`, `category`, `date`, `created_at`, `updated_at`) VALUES
(1, 8, 2, 'First Payment Done', '30000.00', 'client_payment', '2026-01-25', '2026-01-25 14:38:33', '2026-01-25 14:38:33'),
(2, 8, 3, 'First Invoice', '150000.00', 'Earning', '2026-01-26', '2026-01-26 10:47:01', '2026-01-26 10:47:01');

-- --------------------------------------------------------

--
-- Table structure for table `project_purchases`
--

CREATE TABLE `project_purchases` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `vendor` varchar(255) DEFAULT NULL,
  `date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project_purchases`
--

INSERT INTO `project_purchases` (`id`, `user_id`, `project_id`, `item_name`, `cost`, `category`, `vendor`, `date`, `created_at`, `updated_at`) VALUES
(1, 8, 1, 'Labor', '10000.00', 'Services', 'Softcodelk', '2026-01-25', '2026-01-25 11:47:05', '2026-01-25 11:47:05'),
(2, 8, 3, 'Sand', '4000.00', 'Row Meterial', 'Sudharma', '2026-01-26', '2026-01-26 10:45:50', '2026-01-26 10:45:50'),
(3, 13, 4, 'Buy a software', '40000.00', 'Software', 'Sudharma', '2026-01-27', '2026-01-27 07:43:40', '2026-01-27 07:43:40');

-- --------------------------------------------------------

--
-- Table structure for table `project_time_entries`
--

CREATE TABLE `project_time_entries` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime DEFAULT NULL,
  `duration` int(11) DEFAULT 0,
  `is_running` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project_time_entries`
--

INSERT INTO `project_time_entries` (`id`, `user_id`, `project_id`, `description`, `start_time`, `end_time`, `duration`, `is_running`, `created_at`, `updated_at`) VALUES
(8, 8, 1, 'Working on Hudson Marketing', '2026-01-25 12:15:12', '2026-01-25 12:16:19', 331, 0, '2026-01-25 12:15:12', '2026-01-25 12:16:19'),
(9, 8, 1, 'Working on Hudson Marketing', '2026-01-25 12:17:12', NULL, 0, 1, '2026-01-25 12:17:12', '2026-01-25 12:17:12'),
(10, 8, 2, 'Working on TD Micro Credit', '2026-01-25 12:29:13', '2026-01-25 12:29:14', 330, 0, '2026-01-25 12:29:13', '2026-01-25 12:29:14'),
(11, 8, 1, 'Working on Hudson Marketing', '2026-01-25 12:29:15', '2026-01-25 12:29:16', 330, 0, '2026-01-25 12:29:15', '2026-01-25 12:29:16');

-- --------------------------------------------------------

--
-- Table structure for table `push_subscriptions`
--

CREATE TABLE `push_subscriptions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `endpoint` varchar(255) NOT NULL,
  `p256dh` varchar(255) NOT NULL,
  `auth` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `push_subscriptions`
--

INSERT INTO `push_subscriptions` (`id`, `user_id`, `endpoint`, `p256dh`, `auth`, `created_at`) VALUES
(1, 12, 'https://fcm.googleapis.com/fcm/send/e2epmKuWah8:APA91bFSxxm9ha8VU0PuBPU_jN1gMr4gmSAnnTmJa_cmnf6-xFqDHJnU93vxYZIDKniC7ozYU8dzZ9KIaewZaj9CRTkyjKztnBWrt3Qq1DoORTp6jsrJmZd1pZWEE5SROCOuvpCZowV0', 'BLa6MnYw0hROLC3NZO-r-WojGZda8wenTtQ-pwfsiIemdTo9OTQSQThi8MXUM7vbmT1YLhCFOjwX6-TnsjbbSrA', 'CTyHBs6568iQqw0v1DeWoA', '2026-02-03 06:33:47');

-- --------------------------------------------------------

--
-- Table structure for table `subscriptions`
--

CREATE TABLE `subscriptions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `plan_name` varchar(100) NOT NULL,
  `plan_type` enum('free','basic','premium','enterprise') DEFAULT 'free',
  `status` enum('active','inactive','cancelled','past_due') DEFAULT 'active',
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'USD',
  `billing_cycle` enum('monthly','yearly') DEFAULT 'monthly',
  `current_period_start` date NOT NULL,
  `current_period_end` date NOT NULL,
  `trial_end` date DEFAULT NULL,
  `cancel_at_period_end` tinyint(1) DEFAULT 0,
  `payment_method_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subscriptions`
--

INSERT INTO `subscriptions` (`id`, `user_id`, `plan_name`, `plan_type`, `status`, `amount`, `currency`, `billing_cycle`, `current_period_start`, `current_period_end`, `trial_end`, `cancel_at_period_end`, `payment_method_id`, `created_at`, `updated_at`) VALUES
(1, 1, 'Premium Plan', 'premium', 'active', '29.99', 'USD', 'monthly', '2024-01-01', '2024-01-31', NULL, 0, 1, '2026-01-20 06:21:09', '2026-01-20 06:21:09'),
(2, 14, 'Free Plan', '', 'active', '0.00', 'LKR', 'monthly', '2026-02-05', '2026-03-05', NULL, 0, 2, '2026-02-05 09:06:24', '2026-02-05 09:06:24'),
(3, 16, 'Free Plan', '', 'active', '0.00', 'LKR', 'monthly', '2026-02-05', '2026-03-05', NULL, 0, 3, '2026-02-05 09:25:57', '2026-02-05 09:25:57');

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `status` enum('todo','inProgress','done') DEFAULT 'todo',
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `category` varchar(50) DEFAULT 'general',
  `planned_date` date DEFAULT NULL,
  `allocated_hours` decimal(6,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `schedule_time` time DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`id`, `user_id`, `title`, `status`, `priority`, `category`, `planned_date`, `allocated_hours`, `created_at`, `updated_at`, `schedule_time`) VALUES
(1, 1, 'Review budget', 'todo', 'high', 'job', '2026-01-20', '2.00', '2026-01-20 07:31:32', '2026-01-20 07:31:32', NULL),
(2, 1, 'Plan meal prep', 'todo', 'medium', 'personal', '2026-01-20', '1.00', '2026-01-20 07:31:32', '2026-01-20 07:31:32', NULL),
(3, 1, 'Update expense tracker', 'inProgress', 'high', 'job', '2026-01-20', '1.50', '2026-01-20 07:31:32', '2026-01-20 07:31:32', NULL),
(4, 1, 'Pay bills', 'done', 'low', 'personal', '2026-01-20', '0.50', '2026-01-20 07:31:32', '2026-01-20 07:31:32', NULL),
(5, 1, 'Check savings account', 'done', 'medium', 'job', '2026-01-20', '0.25', '2026-01-20 07:31:32', '2026-01-20 07:31:32', NULL),
(7, 2, 'HOD Meeting', 'done', 'medium', 'job', '2026-01-20', '0.50', '2026-01-20 06:41:50', '2026-01-20 06:43:03', NULL),
(8, 2, 'Hair Cutting', 'done', 'medium', 'personal', '2026-01-20', '1.00', '2026-01-20 07:52:19', '2026-01-20 07:53:41', NULL),
(9, 2, 'Meet Doctor', 'done', 'high', 'personal', '2026-01-20', '0.50', '2026-01-20 07:54:36', '2026-01-20 09:34:18', NULL),
(10, NULL, 'Review budget', 'todo', 'high', 'general', NULL, '0.00', '2026-01-26 04:27:18', '2026-01-26 04:27:18', NULL),
(11, NULL, 'Plan meal prep', 'todo', 'medium', 'general', NULL, '0.00', '2026-01-26 04:27:18', '2026-01-26 04:27:18', NULL),
(12, NULL, 'Update expense tracker', 'inProgress', 'high', 'general', NULL, '0.00', '2026-01-26 04:27:18', '2026-01-26 04:27:18', NULL),
(13, NULL, 'Pay bills', 'done', 'low', 'general', NULL, '0.00', '2026-01-26 04:27:18', '2026-01-26 04:27:18', NULL),
(14, NULL, 'Check savings account', 'done', 'medium', 'general', NULL, '0.00', '2026-01-26 04:27:18', '2026-01-26 04:27:18', NULL),
(15, 8, 'HOD Meeting', 'inProgress', 'high', 'job', '2026-01-26', '0.50', '2026-01-26 10:41:34', '2026-01-26 10:41:44', NULL),
(16, 12, 'HOD Meeting', 'done', 'high', 'job', '2026-01-27', '1.00', '2026-01-27 07:37:37', '2026-01-27 07:38:08', NULL),
(20, 12, 'HOD Meeting', 'done', 'medium', 'job', '2026-02-03', '1.00', '2026-02-03 07:04:41', '2026-02-03 07:12:06', '13:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `task_time_logs`
--

CREATE TABLE `task_time_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `task_time_logs`
--

INSERT INTO `task_time_logs` (`id`, `user_id`, `task_id`, `start_time`, `end_time`, `duration_minutes`, `created_at`, `updated_at`) VALUES
(11, 2, 7, '2026-01-20 12:11:52', '2026-01-20 12:13:03', 1, '2026-01-20 06:41:52', '2026-01-20 06:43:03'),
(12, 2, 8, '2026-01-20 13:22:27', '2026-01-20 13:23:41', 1, '2026-01-20 07:52:27', '2026-01-20 07:53:41'),
(13, 2, 9, '2026-01-20 13:34:49', '2026-01-20 14:32:25', 57, '2026-01-20 08:04:49', '2026-01-20 09:02:25'),
(14, 2, 9, '2026-01-20 14:32:27', '2026-01-20 14:41:05', 8, '2026-01-20 09:02:27', '2026-01-20 09:11:05'),
(15, 2, 9, '2026-01-20 14:41:06', '2026-01-20 14:41:42', 0, '2026-01-20 09:11:06', '2026-01-20 09:11:42'),
(16, 2, 9, '2026-01-20 14:41:43', '2026-01-20 14:41:48', 0, '2026-01-20 09:11:43', '2026-01-20 09:11:48'),
(17, 2, 9, '2026-01-20 14:41:49', '2026-01-20 14:41:52', 0, '2026-01-20 09:11:49', '2026-01-20 09:11:52'),
(18, 2, 9, '2026-01-20 14:41:53', '2026-01-20 15:04:08', 22, '2026-01-20 09:11:53', '2026-01-20 09:34:08'),
(19, 2, 9, '2026-01-20 15:04:13', '2026-01-20 15:04:15', 0, '2026-01-20 09:34:13', '2026-01-20 09:34:15'),
(20, 2, 9, '2026-01-20 15:04:16', '2026-01-20 15:04:18', 0, '2026-01-20 09:34:16', '2026-01-20 09:34:18'),
(21, 8, 15, '2026-01-26 16:11:44', NULL, NULL, '2026-01-26 10:41:44', '2026-01-26 10:41:44'),
(22, 12, 16, '2026-01-27 13:07:51', '2026-01-27 13:08:08', 0, '2026-01-27 07:37:51', '2026-01-27 07:38:08'),
(23, 12, 20, '2026-02-03 12:39:36', '2026-02-03 12:42:06', 2, '2026-02-03 07:09:36', '2026-02-03 07:12:06');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `fullname` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `currency` varchar(10) DEFAULT 'USD',
  `password` varchar(255) NOT NULL,
  `role` enum('super_admin','admin','user') DEFAULT 'user',
  `status` enum('active','inactive') DEFAULT 'active',
  `is_paid` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `job_type` enum('freelancer','businessman','software_engineer','employee') DEFAULT NULL,
  `job_subcategory` varchar(100) DEFAULT NULL,
  `verified` tinyint(1) DEFAULT 0,
  `super_free` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `fullname`, `email`, `phone`, `address`, `country`, `currency`, `password`, `role`, `status`, `is_paid`, `created_at`, `job_type`, `job_subcategory`, `verified`, `super_free`) VALUES
(1, 'superadmin', 'Super Admin', 'admin@blueprint.com', '1234567890', 'Admin Address', 'United States', 'USD', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', 'active', 1, '2026-01-20 06:21:09', NULL, NULL, 0, 0),
(2, 'Sachintha', 'Sachintha Upekha', 'sachintha@gmail.com', '0713434556', NULL, 'Sri Lanka', 'LKR', '$2b$10$mGSmqJrzEWMMcosujboCDeSy4mM8ACiXeGJpccKYrNAVtzOX5Xjq2', 'user', 'active', 0, '2026-01-20 06:36:39', NULL, NULL, 0, 0),
(4, 'testuser2', 'Test User', 'test2@example.com', '1234567891', NULL, 'USA', 'USD', '$2b$10$oWOpW2o53hDyHqip7J61YeUbAmcGljDSZbuSsg9iHjRPRaLy4ZRDi', 'user', 'active', 0, '2026-01-25 10:01:52', NULL, NULL, 0, 1),
(5, 'udara2004', 'Udara Madumal', 'udara@gmail.com', '0713370443', NULL, 'Sri Lanka', 'LKR', '$2b$10$4PisychtnshXdmDRljlZ0O1rJuSNgowa51FwjxmrcTA8HyBQwi6pe', 'user', 'active', 0, '2026-01-25 10:45:44', 'businessman', NULL, 0, 1),
(6, 'testuser5', 'Test User 5', 'test5@example.com', '1234567894', NULL, 'USA', 'USD', '$2b$10$YG4RbiHN.EH6wlAwiQmfnOl17VKV1VPdMYXqF06riSDzG1fRRREHm', 'user', 'active', 0, '2026-01-25 11:03:15', 'freelancer', NULL, 0, 0),
(7, 'Dasun12', 'Dasun Senewirathna', 'dassa@gmail.com', '0712323445', NULL, 'Sri Lanka', 'LKR', '$2b$10$mUDIyn180umgmRCsu3.7.uYMMt5kcK4FA2/JBxVsGVqZUN14QoCN.', 'user', 'active', 0, '2026-01-25 11:08:53', 'businessman', 'Construction', 0, 0),
(8, 'Sudahrma1993', 'Sudharma Hewavitharana', 'sudharma@gmail.com', '0712323112', NULL, 'Sri Lanka', 'LKR', '$2b$10$WBHLBJdbbZ/iJhr7XZzpZ.w4bXs0Ap9OUAC0KgHGdsbaQYu/5OHS.', 'user', 'active', 0, '2026-01-25 11:19:38', 'freelancer', 'Software & Web Development', 0, 0),
(12, 'dammikapra', 'Dammika Prabath', 'dammikapra@gmail.com', '0712323113', NULL, 'Sri Lanka', 'LKR', '$2b$10$CfINV88Mi79MfDjiSgXOhuLA3PCcZhVV2hUh/OtzIVt20vn3V8LQO', 'user', 'active', 0, '2026-01-26 17:48:36', 'businessman', 'Gem Business', 0, 0),
(13, 'Ruwan', 'Ruwan', 'ruwan@gmail.com', '0714545667', NULL, 'Sri Lanka', 'LKR', '$2b$10$m/.hE0MQSCeYe69MOMpCnuExCmdMJdX2voomJanAhthJZvsM0GUGe', 'user', 'active', 0, '2026-01-27 07:42:15', 'freelancer', 'Software & Web Development', 0, 0),
(14, 'Danushka1998', 'Danushka Priyadarshana', 'danushka@gmail.com', '0712332443', NULL, 'Sri Lanka', 'LKR', '$2b$10$94QdBLd9FWIaTGBoyOge1.vQeyt/okN2tC5zeI8yeeN6vlDm/XHKK', 'user', 'active', 1, '2026-02-05 09:06:24', 'freelancer', 'Software & Web Development', 0, 0),
(16, 'seelawathi12', 'seelawathi', 'seelawathi@gmail.com', '0712323110', NULL, 'Sri Lanka', 'LKR', '$2b$10$Jed9TOCUgBv316U/mVq2EuObGk4DyqDZC0YtkKENDlwauIXtJqsXC', 'user', 'active', 1, '2026-02-05 09:25:57', 'freelancer', 'Software & Web Development', 0, 0),
(17, 'Nimal12', 'Nimal Hewavitharana', 'nimal@gmail.com', '0712323117', NULL, 'Sri Lanka', 'LKR', '$2b$10$yYH541yWxCidVa5M9per2.Shugt4zzTGWT5vVvzlrp6zLg9Bj8vW6', 'user', 'active', 0, '2026-02-05 10:46:35', 'businessman', 'Gem Business', 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `make` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `vehicle_no` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vehicles`
--

INSERT INTO `vehicles` (`id`, `user_id`, `name`, `make`, `model`, `year`, `created_at`, `vehicle_no`) VALUES
(1, 2, 'Toyota Allion 240', 'Toyota', 'Allion', 2012, '2026-01-20 15:11:01', 'CAA1221'),
(2, 12, 'Allion 240', 'Toyota', 'Allion', 2014, '2026-01-27 07:38:47', 'CAA1221');

-- --------------------------------------------------------

--
-- Table structure for table `vehicle_expenses`
--

CREATE TABLE `vehicle_expenses` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `date` date NOT NULL,
  `vehicle` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vehicle_expenses`
--

INSERT INTO `vehicle_expenses` (`id`, `user_id`, `description`, `amount`, `date`, `vehicle`) VALUES
(1, 1, 'Fuel', '60.00', '2023-10-01', 'Toyota Camry'),
(2, 1, 'Maintenance', '150.00', '2023-10-05', 'Toyota Camry'),
(3, 1, 'Insurance', '120.00', '2023-10-10', 'Honda Civic'),
(4, 2, 'Wedding Hire', '-15000.00', '2026-01-20', 'Toyota Allion 240'),
(5, 2, 'Full Service', '12000.00', '2026-01-21', 'Toyota Allion 240'),
(6, NULL, 'Fuel', '60.00', '2023-10-01', 'Toyota Camry'),
(7, NULL, 'Maintenance', '150.00', '2023-10-05', 'Toyota Camry'),
(8, NULL, 'Insurance', '120.00', '2023-10-10', 'Honda Civic'),
(10, 12, 'Full Service', '22000.00', '2026-02-04', 'Allion 240');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `achievements`
--
ALTER TABLE `achievements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `api_keys`
--
ALTER TABLE `api_keys`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `businesses`
--
ALTER TABLE `businesses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `gem_expenses`
--
ALTER TABLE `gem_expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `inventory_id` (`inventory_id`);

--
-- Indexes for table `gem_inventory`
--
ALTER TABLE `gem_inventory`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `purchase_id` (`purchase_id`);

--
-- Indexes for table `gem_inventory_images`
--
ALTER TABLE `gem_inventory_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `inventory_id` (`inventory_id`);

--
-- Indexes for table `gem_inventory_tracking`
--
ALTER TABLE `gem_inventory_tracking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `inventory_id` (`inventory_id`);

--
-- Indexes for table `gem_purchases`
--
ALTER TABLE `gem_purchases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `gem_purchase_images`
--
ALTER TABLE `gem_purchase_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `purchase_id` (`purchase_id`);

--
-- Indexes for table `gem_sales`
--
ALTER TABLE `gem_sales`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `inventory_id` (`inventory_id`);

--
-- Indexes for table `goals`
--
ALTER TABLE `goals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `income`
--
ALTER TABLE `income`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `notes`
--
ALTER TABLE `notes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `password_entries`
--
ALTER TABLE `password_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `project_documents`
--
ALTER TABLE `project_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `project_id` (`project_id`);

--
-- Indexes for table `project_income`
--
ALTER TABLE `project_income`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `project_id` (`project_id`);

--
-- Indexes for table `project_purchases`
--
ALTER TABLE `project_purchases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `project_id` (`project_id`);

--
-- Indexes for table `project_time_entries`
--
ALTER TABLE `project_time_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `project_id` (`project_id`);

--
-- Indexes for table `push_subscriptions`
--
ALTER TABLE `push_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_user_endpoint` (`user_id`,`endpoint`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `payment_method_id` (`payment_method_id`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `task_time_logs`
--
ALTER TABLE `task_time_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `task_id` (`task_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `phone` (`phone`);

--
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `vehicle_expenses`
--
ALTER TABLE `vehicle_expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_vehicle_expenses_user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `achievements`
--
ALTER TABLE `achievements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `api_keys`
--
ALTER TABLE `api_keys`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `businesses`
--
ALTER TABLE `businesses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `gem_expenses`
--
ALTER TABLE `gem_expenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gem_inventory`
--
ALTER TABLE `gem_inventory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `gem_inventory_images`
--
ALTER TABLE `gem_inventory_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gem_inventory_tracking`
--
ALTER TABLE `gem_inventory_tracking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gem_purchases`
--
ALTER TABLE `gem_purchases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `gem_purchase_images`
--
ALTER TABLE `gem_purchase_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `gem_sales`
--
ALTER TABLE `gem_sales`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `goals`
--
ALTER TABLE `goals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `income`
--
ALTER TABLE `income`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `notes`
--
ALTER TABLE `notes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `password_entries`
--
ALTER TABLE `password_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payment_methods`
--
ALTER TABLE `payment_methods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `project_documents`
--
ALTER TABLE `project_documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `project_income`
--
ALTER TABLE `project_income`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `project_purchases`
--
ALTER TABLE `project_purchases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `project_time_entries`
--
ALTER TABLE `project_time_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `push_subscriptions`
--
ALTER TABLE `push_subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `subscriptions`
--
ALTER TABLE `subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `task_time_logs`
--
ALTER TABLE `task_time_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `vehicle_expenses`
--
ALTER TABLE `vehicle_expenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `achievements`
--
ALTER TABLE `achievements`
  ADD CONSTRAINT `achievements_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `api_keys`
--
ALTER TABLE `api_keys`
  ADD CONSTRAINT `api_keys_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `businesses`
--
ALTER TABLE `businesses`
  ADD CONSTRAINT `businesses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `gem_expenses`
--
ALTER TABLE `gem_expenses`
  ADD CONSTRAINT `gem_expenses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `gem_expenses_ibfk_2` FOREIGN KEY (`inventory_id`) REFERENCES `gem_inventory` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `gem_inventory`
--
ALTER TABLE `gem_inventory`
  ADD CONSTRAINT `gem_inventory_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `gem_inventory_ibfk_2` FOREIGN KEY (`purchase_id`) REFERENCES `gem_purchases` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `gem_inventory_images`
--
ALTER TABLE `gem_inventory_images`
  ADD CONSTRAINT `gem_inventory_images_ibfk_1` FOREIGN KEY (`inventory_id`) REFERENCES `gem_inventory` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `gem_inventory_tracking`
--
ALTER TABLE `gem_inventory_tracking`
  ADD CONSTRAINT `gem_inventory_tracking_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `gem_inventory_tracking_ibfk_2` FOREIGN KEY (`inventory_id`) REFERENCES `gem_inventory` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `gem_purchases`
--
ALTER TABLE `gem_purchases`
  ADD CONSTRAINT `gem_purchases_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `gem_purchase_images`
--
ALTER TABLE `gem_purchase_images`
  ADD CONSTRAINT `gem_purchase_images_ibfk_1` FOREIGN KEY (`purchase_id`) REFERENCES `gem_purchases` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `gem_sales`
--
ALTER TABLE `gem_sales`
  ADD CONSTRAINT `gem_sales_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `gem_sales_ibfk_2` FOREIGN KEY (`inventory_id`) REFERENCES `gem_inventory` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `goals`
--
ALTER TABLE `goals`
  ADD CONSTRAINT `goals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `income`
--
ALTER TABLE `income`
  ADD CONSTRAINT `income_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `notes`
--
ALTER TABLE `notes`
  ADD CONSTRAINT `notes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `password_entries`
--
ALTER TABLE `password_entries`
  ADD CONSTRAINT `password_entries_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD CONSTRAINT `payment_methods_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_documents`
--
ALTER TABLE `project_documents`
  ADD CONSTRAINT `project_documents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_documents_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_income`
--
ALTER TABLE `project_income`
  ADD CONSTRAINT `project_income_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_income_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_purchases`
--
ALTER TABLE `project_purchases`
  ADD CONSTRAINT `project_purchases_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_purchases_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_time_entries`
--
ALTER TABLE `project_time_entries`
  ADD CONSTRAINT `project_time_entries_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_time_entries_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `push_subscriptions`
--
ALTER TABLE `push_subscriptions`
  ADD CONSTRAINT `push_subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `subscriptions_ibfk_2` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`);

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `task_time_logs`
--
ALTER TABLE `task_time_logs`
  ADD CONSTRAINT `task_time_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `task_time_logs_ibfk_2` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`);

--
-- Constraints for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD CONSTRAINT `vehicles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vehicle_expenses`
--
ALTER TABLE `vehicle_expenses`
  ADD CONSTRAINT `fk_vehicle_expenses_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `vehicle_expenses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
