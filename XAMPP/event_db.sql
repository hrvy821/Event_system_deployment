-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 06, 2026 at 10:55 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `event_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `attendee`
--

CREATE TABLE `attendee` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `company` varchar(255) DEFAULT NULL,
  `eventId` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'Pending',
  `ticketId` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attendee`
--

INSERT INTO `attendee` (`id`, `name`, `email`, `company`, `eventId`, `status`, `ticketId`) VALUES
(7, 'Deejay Sarinas', 'deejaysarinas22@gmail.com', 'tech', '8', 'Checked In', 'TIX-4528'),
(8, 'Deejay', 'rojanegacu21@gmail.com', 'tech', '9', 'Checked In', 'TIX-5428'),
(11, 'Tenshi Mi', 'TenshiMi@gmail.com', 'harry potter', '10', 'Checked In', 'TIX-4533'),
(12, 'Document Example', 'john@example.com', 'Tech Corp', '5', 'Pending', 'TIX-7582');

-- --------------------------------------------------------

--
-- Table structure for table `event`
--

CREATE TABLE `event` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `date` varchar(255) NOT NULL,
  `time` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `category` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` varchar(255) NOT NULL,
  `announcement` varchar(255) DEFAULT NULL,
  `organizerId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `event`
--

INSERT INTO `event` (`id`, `title`, `date`, `time`, `location`, `category`, `description`, `price`, `announcement`, `organizerId`) VALUES
(6, 'miane\'s birthday party', '2026-01-14', '12:04', 'Imus Cavite', 'Meetup', 'birthday ko ngani', '20', 'mamanyo hatdog', 0),
(8, 'Organizer', '2026-01-15', '10:50', 'Imus Cavite', 'Conference', 'THisss is exmaple', '200', NULL, 17),
(9, 'test1', '2026-01-22', '00:34', 'imus cavite', 'Concert', 'test 1', '500', NULL, 17),
(10, 'enhypen\'s meet and greet', '2026-01-31', '08:00', 'philippine arena', 'Meetup', 'let\'s go jayy', '1250', NULL, 21),
(11, 'Tech Conference 2024', '2024-12-25', '10:00 AM', 'Convention Center', 'Technology', 'A conference about latest tech trends', '50.00', NULL, 1),
(12, 'Tech Conference 2024', '2024-12-25', '10:00 AM', 'Convention Center', 'Technology', 'A conference about latest tech trends', '50.00', NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `time` varchar(50) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `price` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'Attendee',
  `isActive` tinyint(4) NOT NULL DEFAULT 1,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `resetOtpExpires` datetime DEFAULT NULL,
  `resetOtp` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `name`, `role`, `isActive`, `email`, `password`, `resetOtpExpires`, `resetOtp`) VALUES
(3, 'Deejay', 'Attendee', 1, 'rojanegacu21@gmail.com', '$2b$10$N1lm4zZwgndNqkuXbL491uhmr/tMN012iKsVxb51DrBhWblRoVKja', NULL, NULL),
(4, 'Lei Sarinas', 'Attendee', 1, 'sarinasdianalei@gmail.com', '$2b$10$YrbaMw1iIdbgkbTnkZX8Ce.w1252tQph4p8ZDwt0rlZOdNwu7idvm', NULL, NULL),
(8, 'Lei Sarinas', 'Attendee', 1, 'test2@gmail.com', '$2b$10$7dTpAQAnVcdZ5G2PL3tsPuE9Bo/5SOZW9FbXDDuuRs4reeENTsx2O', NULL, NULL),
(12, 'Deejay Sarinas', 'Attendee', 1, 'deejaysarinas22@gmail.com', '$2b$10$lL5y/8ZuFZwrPH515uAjEOnUTsTTNHnMy54LpVt4RNrGKjJF981d2', NULL, NULL),
(13, 'Deejay Sarinas', 'Admin', 1, 'admin@gmail.com', '$2b$10$m0M.yMsV4mFMr3eEWcmftur4A75F18OP5NEYCWZxZfZeRRSIP9.Ha', NULL, NULL),
(16, 'Miane Gacu', 'Admin', 1, 'mianegacu@gmail.com', '$2b$10$3T4qv4W2o.49Gvc6lXSJmOnkBjPdaZ6xG.rZ7XuuNlYvHjuvKaAna', NULL, NULL),
(17, 'Miane Gacu', 'Organizer', 1, 'organizer@gmail.com', '$2b$10$8ZFKRxb1OC1g7MJs8mtHcOed7ZWfILpWvmlWNLfygRjp/Gom3bwlG', NULL, NULL),
(18, 'John Sarinas', 'Organizer', 1, 'johnsarinas@gmail.com', '$2b$10$6VmfQ6QJKIxbfpwIk.xj9uTKJ//E1/Ou1O8rilws72SCZt.vvwxMq', NULL, NULL),
(19, 'miane gacu', 'Attendee', 1, 'miane@gmail.com', '$2b$10$7iWX0zTKV.OAz.P4XLHpT.zHAyt2jWEoSTNUteWeToKZE1Q6CTf.i', NULL, NULL),
(20, 'miane amara', 'Organizer', 1, 'hatdog@gmail.com', '$2b$10$AR9zKKxgoqc7MEVdlasECOyjbpGMY1YXWhOIQbYEkEuIpQw/a.OcW', NULL, NULL),
(21, 'Rojane  Gacu', 'Organizer', 1, 'rojanegacu@gmail.com', '$2b$10$Alf2VKiXtjpm86rGSe9iHuWmtvrsU4JOAXPQcPnTyY/.fqtsBzecG', NULL, NULL),
(22, 'Tenshi Mi', 'Attendee', 1, 'TenshiMi@gmail.com', '$2b$10$df1NfqRDN/vWxwhfCeTyjuhNAKzl06S2VPGKrddh76vwtkPuq0mpy', NULL, NULL),
(23, 'jame carlo asperilla', 'Organizer', 1, 'hamescarlo@gmail.com', '$2b$10$EaMU6AWhuiAco8vK6U5h/OTuY.ZSdUlnXgJix0LU5FMKNYarAjXYa', NULL, NULL),
(24, 'John Doe', 'attendee', 1, 'document@example.com', '$2b$10$Kx8hO.wHjwNrVeNltheNWOdqHK3NlvRncSqFywpKn8yn5XUDlT9GG', NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendee`
--
ALTER TABLE `attendee`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `event`
--
ALTER TABLE `event`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `IDX_e12875dfb3b1d92d7d7c5377e2` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attendee`
--
ALTER TABLE `attendee`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `event`
--
ALTER TABLE `event`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
