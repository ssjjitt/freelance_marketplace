-- Схема БД freelance_marketplace (MySQL 8, utf8mb4, UTF-8).
-- Соответствует Sequelize-моделям backend; имя БД задаётся MYSQL_DATABASE / DB_NAME в docker-compose.
-- Данные — в 02_data.sql.
--
-- Про NULL: в CREATE TABLE «NULL» значит «поле можно не заполнять» (профиль, дедлайн, второй FK и т.д.).
-- Явный DEFAULT NULL в MySQL не обязателен — ниже он опущен, где достаточно допуска NULL.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

DROP TABLE IF EXISTS `reports`;
DROP TABLE IF EXISTS `disputes`;
DROP TABLE IF EXISTS `tickets`;
DROP TABLE IF EXISTS `ratings`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `chats`;
DROP TABLE IF EXISTS `favorites`;
DROP TABLE IF EXISTS `attachments`;
DROP TABLE IF EXISTS `applications`;
DROP TABLE IF EXISTS `resumes`;
DROP TABLE IF EXISTS `services`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `contacts`;
DROP TABLE IF EXISTS `profile_skills`;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `profiles`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `skills`;
DROP TABLE IF EXISTS `roles`;

CREATE TABLE `roles` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `skills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `isBlocked` tinyint(1) NOT NULL DEFAULT 0,
  `lastSeen` datetime NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `blockReason` text NULL,
  `blockedAt` datetime NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text NULL,
  `parentId` int NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `parentId` (`parentId`),
  CONSTRAINT `categories_parent_fk` FOREIGN KEY (`parentId`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `lastname` varchar(255) NULL,
  `name` varchar(255) NULL,
  `birthday` datetime NULL,
  `gender` varchar(255) NULL,
  `country` varchar(255) NULL,
  `city` varchar(255) NULL,
  `education` varchar(255) NULL,
  `website` varchar(255) NULL,
  `phone` varchar(255) NULL,
  `email` varchar(255) NULL,
  `about` text NULL,
  `availability` varchar(255) NULL,
  `completedProjects` int NOT NULL DEFAULT 0,
  `inProgress` int NOT NULL DEFAULT 0,
  `rating` float NOT NULL DEFAULT 0,
  `responseTimeHours` int NOT NULL DEFAULT 0,
  `avatar` longtext NULL,
  `profileViews` int NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `profiles_user_fk` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `contacts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `profileId` int NOT NULL,
  `type` enum('messenger','social','other') NOT NULL,
  `platform` varchar(255) NOT NULL,
  `username` varchar(255) NULL,
  `url` varchar(255) NULL,
  `phone` varchar(255) NULL,
  `email` varchar(255) NULL,
  `isPublic` tinyint(1) NOT NULL DEFAULT 1,
  `order` int NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `contacts_profile_id` (`profileId`),
  KEY `contacts_type` (`type`),
  KEY `contacts_platform` (`platform`),
  CONSTRAINT `contacts_profile_fk` FOREIGN KEY (`profileId`) REFERENCES `profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `profile_skills` (
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `profileId` int NOT NULL,
  `skillId` int NOT NULL,
  PRIMARY KEY (`profileId`,`skillId`),
  KEY `skillId` (`skillId`),
  CONSTRAINT `profile_skills_profile_fk` FOREIGN KEY (`profileId`) REFERENCES `profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `profile_skills_skill_fk` FOREIGN KEY (`skillId`) REFERENCES `skills` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_roles` (
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `roleId` int NOT NULL,
  `userId` int NOT NULL,
  PRIMARY KEY (`roleId`,`userId`),
  KEY `user_roles_user` (`userId`),
  CONSTRAINT `user_roles_role_fk` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_roles_user_fk` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customerId` int NOT NULL,
  `categoryId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `budget` decimal(10,2) NULL,
  `deadline` datetime NULL,
  `status` enum('open','in_progress','completed','cancelled','hidden','closed','dispute') NOT NULL DEFAULT 'open',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `isModerated` tinyint(1) NOT NULL DEFAULT 0,
  `moderationReason` text NULL,
  `moderatorTrustBadge` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `customerId` (`customerId`),
  KEY `categoryId` (`categoryId`),
  CONSTRAINT `orders_customer_fk` FOREIGN KEY (`customerId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `orders_category_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `executerId` int NOT NULL,
  `categoryId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `price` decimal(10,2) NULL,
  `status` enum('active','inactive','completed','cancelled') NOT NULL DEFAULT 'active',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `isApproved` tinyint(1) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `executerId` (`executerId`),
  KEY `categoryId` (`categoryId`),
  CONSTRAINT `services_executer_fk` FOREIGN KEY (`executerId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `services_category_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `orderId` int NULL,
  `serviceId` int NULL,
  `message` text NULL,
  `proposedPrice` decimal(10,2) NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `orderId` (`orderId`),
  KEY `serviceId` (`serviceId`),
  CONSTRAINT `applications_user_fk` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `applications_order_fk` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `applications_service_fk` FOREIGN KEY (`serviceId`) REFERENCES `services` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `attachments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` int NULL,
  `serviceId` int NULL,
  `storedPath` varchar(1024) NOT NULL,
  `originalName` varchar(512) NOT NULL,
  `mimeType` varchar(255) NULL,
  `size` int NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `orderId` (`orderId`),
  KEY `serviceId` (`serviceId`),
  CONSTRAINT `attachments_order_fk` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `attachments_service_fk` FOREIGN KEY (`serviceId`) REFERENCES `services` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `favorites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customerId` int NOT NULL,
  `executerId` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `favorites_customer_id_executer_id` (`customerId`,`executerId`),
  KEY `executerId` (`executerId`),
  CONSTRAINT `favorites_customer_fk` FOREIGN KEY (`customerId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `favorites_executer_fk` FOREIGN KEY (`executerId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `resumes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `executerId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `experience` text NULL,
  `education` text NULL,
  `skills` text NULL,
  `portfolio` varchar(255) NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `isApproved` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `executerId` (`executerId`),
  CONSTRAINT `resumes_executer_fk` FOREIGN KEY (`executerId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `chats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user1Id` int NOT NULL,
  `user2Id` int NOT NULL,
  `lastMessageAt` datetime NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `chats_user1_id_user2_id` (`user1Id`,`user2Id`),
  KEY `chats_user1_id` (`user1Id`),
  KEY `chats_user2_id` (`user2Id`),
  KEY `chats_last_message_at` (`lastMessageAt`),
  CONSTRAINT `chats_user1_fk` FOREIGN KEY (`user1Id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chats_user2_fk` FOREIGN KEY (`user2Id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `chatId` int NOT NULL,
  `senderId` int NOT NULL,
  `content` text NOT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `readAt` datetime NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `isType` enum('user','system') NOT NULL DEFAULT 'user',
  PRIMARY KEY (`id`),
  KEY `chatId` (`chatId`),
  KEY `senderId` (`senderId`),
  CONSTRAINT `messages_chat_fk` FOREIGN KEY (`chatId`) REFERENCES `chats` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `messages_sender_fk` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `type` enum('new_application','application_approved','application_rejected','new_message','new_rating','order_status_changed','service_status_changed','system','admin_notification','resume_approved') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `relatedId` int NULL,
  `relatedType` enum('order','service','application','message','rating','resume') NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `readAt` datetime NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `notifications_user_fk` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ratings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fromUserId` int NOT NULL,
  `toUserId` int NOT NULL,
  `orderId` int NULL,
  `serviceId` int NULL,
  `rating` int NOT NULL,
  `comment` text NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fromUserId` (`fromUserId`),
  KEY `toUserId` (`toUserId`),
  KEY `orderId` (`orderId`),
  KEY `serviceId` (`serviceId`),
  CONSTRAINT `ratings_from_fk` FOREIGN KEY (`fromUserId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ratings_to_fk` FOREIGN KEY (`toUserId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ratings_order_fk` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ratings_service_fk` FOREIGN KEY (`serviceId`) REFERENCES `services` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tickets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `subject` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` enum('technical','payment','dispute','abuse','other') NOT NULL DEFAULT 'other',
  `status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `assignedManagerId` int NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `assignedManagerId` (`assignedManagerId`),
  CONSTRAINT `tickets_user_fk` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tickets_manager_fk` FOREIGN KEY (`assignedManagerId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `disputes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` int NULL,
  `applicationId` int NULL,
  `customerId` int NOT NULL,
  `executerId` int NULL,
  `initiatorId` int NULL,
  `reason` text NOT NULL,
  `description` text NULL,
  `status` enum('open','in_review','resolved','closed') NOT NULL DEFAULT 'open',
  `resolution` enum('customer_wins','executer_wins','split','refund') NULL,
  `resolutionComment` text NULL,
  `resolvedByManagerId` int NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `orderId` (`orderId`),
  KEY `applicationId` (`applicationId`),
  KEY `customerId` (`customerId`),
  KEY `executerId` (`executerId`),
  KEY `initiatorId` (`initiatorId`),
  KEY `resolvedByManagerId` (`resolvedByManagerId`),
  CONSTRAINT `disputes_order_fk` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `disputes_application_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `disputes_customer_fk` FOREIGN KEY (`customerId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `disputes_executer_fk` FOREIGN KEY (`executerId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `disputes_initiator_fk` FOREIGN KEY (`initiatorId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `disputes_manager_fk` FOREIGN KEY (`resolvedByManagerId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reporterId` int NOT NULL,
  `targetId` int NOT NULL,
  `targetType` enum('user','order','service') NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','resolved') NOT NULL DEFAULT 'pending',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `reporterId` (`reporterId`),
  CONSTRAINT `reports_reporter_fk` FOREIGN KEY (`reporterId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
