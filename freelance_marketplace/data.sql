-- Тестовые данные: freelance_marketplace (MySQL 8, utf8mb4)
-- После init.sql (docker-compose: 02_data.sql).
-- Учётки: admin, ssjjitt, customer, executer, antikvar, savko, manager
-- Один пароль для всех Qwert123_ (argon2id, как в вашем дампе) — подставьте свой plain text, если хэш другой.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

SET @pwd = '$argon2id$v=19$m=65536,t=3,p=4$8WvKzUfggqiyckoPESy5ZQ$tiOBWqZ3SoC48CEA+TMmIKjcr4kwxR9J2vGSC3HCK98';
SET @t0 = '2026-01-01 00:00:00';
SET @t1 = '2026-01-15 14:30:00';
SET @t2 = '2026-01-20 09:00:00';
SET @t3 = '2026-02-01 11:15:00';

INSERT INTO `roles` (`id`, `name`, `createdAt`, `updatedAt`) VALUES
(1, 'executer', @t0, @t0),
(2, 'customer', @t0, @t0),
(3, 'manager', @t0, @t0),
(4, 'administrator', @t0, @t0);

INSERT INTO `skills` (`id`, `name`, `createdAt`, `updatedAt`) VALUES
(1, 'JavaScript / TypeScript', @t0, @t0),
(2, 'React и экосистема', @t0, @t0),
(3, 'Node.js / Express', @t0, @t0),
(4, 'Вёрстка HTML/CSS', @t0, @t0),
(5, 'Figma и UI-киты', @t0, @t0),
(6, 'Adobe Photoshop', @t0, @t0),
(7, 'Копирайтинг (RU)', @t0, @t0),
(8, 'SEO-аудит', @t0, @t0),
(9, '1С:Предприятие', @t0, @t0),
(10, 'MySQL / Sequelize', @t0, @t0),
(11, 'Docker', @t0, @t0),
(12, 'REST API', @t0, @t0),
(13, 'Моушн-дизайн', @t0, @t0),
(14, 'SMM (VK, Telegram)', @t0, @t0),
(15, 'Технический перевод EN→RU', @t0, @t0),
(16, 'Python', @t0, @t0),
(17, 'Бухгалтерия для ИП', @t0, @t0),
(18, 'Таргетированная реклама', @t0, @t0),
(19, 'Монтаж видео', @t0, @t0),
(20, 'Рерайтинг и редактура', @t0, @t0),
(21, 'Администрирование Linux', @t0, @t0),
(22, 'Тестирование (QA)', @t0, @t0),
(23, 'Vue.js', @t0, @t0),
(24, 'Интеграции и webhooks', @t0, @t0),
(25, 'Презентации PowerPoint', @t0, @t0);

INSERT INTO `users` (`id`, `username`, `email`, `password`, `isBlocked`, `lastSeen`, `createdAt`, `updatedAt`, `blockReason`, `blockedAt`) VALUES
(1, 'admin', 'admin@marketplace.com', @pwd, 0, @t3, @t0, @t3, NULL, NULL),
(2, 'ssjjitt', 'ssjjitt@gmail.com', @pwd, 0, @t3, @t0, @t3, NULL, NULL),
(3, 'customer', 'customer@mail.ru', @pwd, 0, @t2, @t0, @t2, NULL, NULL),
(4, 'executer', 'executer@yandex.ru', @pwd, 0, @t3, @t0, @t3, NULL, NULL),
(5, 'antikvar', 'antikvar@bk.ru', @pwd, 0, @t1, @t0, @t1, NULL, NULL),
(6, 'savko', 'savko@gmail.com', @pwd, 0, @t2, @t0, @t2, NULL, NULL),
(7, 'manager', 'manager@gmail.com', @pwd, 0, @t1, @t0, @t1, NULL, NULL);

INSERT INTO `categories` (`id`, `name`, `description`, `parentId`, `createdAt`, `updatedAt`) VALUES
(1, 'Разработка и IT', 'Веб, мобайл, DevOps, базы данных, автоматизация.', NULL, @t0, @t0),
(2, 'Дизайн и мультимедиа', 'Графика, интерфейсы, видео и анимация.', NULL, @t0, @t0),
(3, 'Тексты и переводы', 'Копирайтинг, переводы, контент для сайтов и соцсетей.', NULL, @t0, @t0),
(4, 'Маркетинг и реклама', 'SEO, SMM, контекст, аналитика.', NULL, @t0, @t0),
(5, 'Бизнес и право', 'Бухгалтерия, юристы, консалтинг для малого бизнеса.', NULL, @t0, @t0),
(6, 'Веб-разработка', 'Лендинги, SPA, интеграции с CRM.', 1, @t0, @t0),
(7, 'Мобильная разработка', 'Приложения под iOS и Android.', 1, @t0, @t0),
(8, 'Дизайн интерфейсов', 'Прототипирование и UI/UX.', 2, @t0, @t0),
(9, 'SMM', 'Ведение сообществ и контент-планы.', 4, @t0, @t0),
(10, 'Бухгалтерия', 'Первичка, отчётность для ИП и ООО.', 5, @t0, @t0);

INSERT INTO `profiles` (`id`, `userId`, `lastname`, `name`, `birthday`, `gender`, `country`, `city`, `education`, `website`, `phone`, `email`, `about`, `availability`, `completedProjects`, `inProgress`, `rating`, `responseTimeHours`, `avatar`, `profileViews`, `createdAt`, `updatedAt`) VALUES
(1, 1, 'Админ', 'Системный', '1988-05-11 00:00:00', 'не указано', 'Беларусь', 'Минск', NULL, NULL, NULL, 'admin@marketplace.com', 'Администратор площадки.', 'По тикетам', 0, 0, 0, 0, NULL, 0, @t0, @t3),
(2, 2, 'Пользователь', 'ssjjitt', '1995-01-01 00:00:00', 'не указано', 'Беларусь', 'Минск', NULL, NULL, NULL, 'ssjjitt@gmail.com', 'Заказчик и исполнитель.', 'Вечером', 5, 1, 4.5, 4, NULL, 40, @t0, @t3),
(3, 3, 'Заказчик', 'Демо', '1992-06-15 00:00:00', 'не указано', 'Беларусь', 'Гродно', NULL, NULL, NULL, 'customer@mail.ru', 'Тестовый заказчик.', 'Пн–Пт', 10, 2, 0, 8, NULL, 120, @t0, @t2),
(4, 4, 'Исполнитель', 'Демо', '1990-03-10 00:00:00', 'не указано', 'Беларусь', 'Брест', NULL, NULL, NULL, 'executer@yandex.ru', 'Тестовый исполнитель, веб.', '30 ч/нед.', 25, 2, 4.8, 3, NULL, 200, @t0, @t3),
(5, 5, 'Антиквар', 'Магазин', '1988-11-20 00:00:00', 'не указано', 'Беларусь', 'Минск', NULL, NULL, NULL, 'antikvar@bk.ru', 'Заказчик, розница.', 'Утро', 8, 1, 4.2, 6, NULL, 90, @t0, @t1),
(6, 6, 'Савко', 'Игорь', '1993-07-08 00:00:00', 'не указано', 'Беларусь', 'Витебск', NULL, NULL, NULL, 'savko@gmail.com', 'Исполнитель, дизайн и вёрстка.', 'Свободен', 15, 1, 4.9, 5, NULL, 150, @t0, @t2),
(7, 7, 'Менеджер', 'Поддержка', '1991-02-01 00:00:00', 'не указано', 'Беларусь', 'Минск', NULL, NULL, NULL, 'manager@gmail.com', 'Менеджер площадки.', '9–18', 0, 3, 0, 2, NULL, 30, @t0, @t1);

INSERT INTO `user_roles` (`createdAt`, `updatedAt`, `roleId`, `userId`) VALUES
(@t0, @t0, 4, 1),
(@t0, @t0, 2, 2),
(@t0, @t0, 1, 2),
(@t0, @t0, 2, 3),
(@t0, @t0, 1, 4),
(@t0, @t0, 2, 5),
(@t0, @t0, 1, 6),
(@t0, @t0, 3, 7);

INSERT INTO `profile_skills` (`createdAt`, `updatedAt`, `profileId`, `skillId`) VALUES
(@t0, @t0, 4, 1), (@t0, @t0, 4, 2), (@t0, @t0, 4, 4), (@t0, @t0, 4, 10),
(@t0, @t0, 6, 5), (@t0, @t0, 6, 6), (@t0, @t0, 6, 4),
(@t0, @t0, 2, 7), (@t0, @t0, 2, 14);

INSERT INTO `contacts` (`id`, `profileId`, `type`, `platform`, `username`, `url`, `phone`, `email`, `isPublic`, `order`, `createdAt`, `updatedAt`) VALUES
(1, 4, 'messenger', 'Telegram', 'executer_demo', NULL, NULL, NULL, 1, 0, @t0, @t0),
(2, 6, 'messenger', 'Telegram', 'savko_design', NULL, NULL, NULL, 1, 0, @t0, @t0),
(3, 3, 'messenger', 'Telegram', 'customer_demo', NULL, NULL, NULL, 1, 0, @t0, @t0);

INSERT INTO `orders` (`id`, `customerId`, `categoryId`, `title`, `description`, `budget`, `deadline`, `status`, `createdAt`, `updatedAt`, `isModerated`, `moderationReason`, `moderatorTrustBadge`) VALUES
(1, 3, 6, 'Лендинг для запуска коллекции', 'Одностраничник, форма заявки, интеграция с Telegram.', 1800.00, '2026-03-01 18:00:00', 'in_progress', @t1, @t2, 1, NULL, 1),
(2, 5, 6, 'Доработка личного кабинета', 'React + REST, фильтры, пагинация, выгрузка Excel.', 4200.00, '2026-04-10 23:59:59', 'open', @t1, @t1, 1, NULL, 1),
(3, 5, 9, 'SMM на месяц', '12 постов, сторис, ответы в комментариях.', 950.00, '2026-02-28 12:00:00', 'completed', @t2, @t3, 1, NULL, 1),
(4, 3, 10, 'Учёт для ИП', 'Упрощёнка, банк, маркетплейсы.', 350.00, '2026-02-15 00:00:00', 'open', @t2, @t2, 0, NULL, 0),
(5, 2, 8, 'Редизайн экранов приложения', 'Figma, 8 экранов, UI kit.', 2600.00, '2026-05-01 00:00:00', 'dispute', @t3, @t3, 1, NULL, 1);

INSERT INTO `services` (`id`, `executerId`, `categoryId`, `title`, `description`, `price`, `status`, `createdAt`, `updatedAt`, `isApproved`, `isActive`) VALUES
(1, 4, 6, 'Вёрстка из Figma за 48 часов', 'Адаптив, семантика, до 5 блоков.', 120.00, 'active', @t0, @t1, 1, 1),
(2, 4, 6, 'Мини-лендинг React + Telegram', 'Форма, отправка в бот.', 450.00, 'active', @t0, @t2, 1, 1),
(3, 6, 8, 'UI-kit в Figma', 'Компоненты и состояния.', 680.00, 'active', @t0, @t1, 1, 1),
(4, 4, 10, 'Обмен 1С и магазин', 'Номенклатура, остатки по расписанию.', 510.00, 'active', @t0, @t2, 1, 1),
(5, 6, 2, 'Обложка YouTube', '1920×1080, PSD.', 85.00, 'inactive', @t0, @t3, 1, 0),
(6, 6, 6, 'API Node.js + JWT', 'CRUD, Swagger.', 1200.00, 'active', @t1, @t2, 1, 1);

INSERT INTO `applications` (`id`, `userId`, `orderId`, `serviceId`, `message`, `proposedPrice`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 4, 2, NULL, 'Готов подключиться, опыт с React Query.', 4100.00, 'pending', @t2, @t2),
(2, 6, 2, NULL, 'Могу UX фильтров и прототип.', 3800.00, 'rejected', @t2, @t2),
(3, 4, 4, NULL, 'Консультация по первичке за 1 встречу.', 320.00, 'approved', @t2, @t3),
(4, 5, NULL, 1, 'Нужна срочная вёрстка.', 120.00, 'approved', @t1, @t1),
(5, 3, NULL, 3, 'Закажем UI-kit.', 650.00, 'pending', @t3, @t3),
(6, 3, NULL, 2, 'Интеграция Telegram и домен.', 450.00, 'pending', @t1, @t1);

INSERT INTO `attachments` (`id`, `orderId`, `serviceId`, `storedPath`, `originalName`, `mimeType`, `size`, `createdAt`, `updatedAt`) VALUES
(1, 1, NULL, 'orders/seed/landing_brief.pdf', 'ТЗ_лендинг.pdf', 'application/pdf', 245760, @t1, @t1),
(2, 2, NULL, 'orders/seed/buglist.docx', 'Замечания.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 42000, @t1, @t1),
(3, NULL, 1, 'services/seed/hero.png', 'hero.png', 'image/png', 182300, @t0, @t0),
(4, NULL, 2, 'services/seed/flow.pdf', 'Схема.pdf', 'application/pdf', 88000, @t0, @t0),
(5, NULL, 3, 'services/seed/preview.png', 'preview.png', 'image/png', 512000, @t0, @t1);

INSERT INTO `favorites` (`id`, `customerId`, `executerId`, `createdAt`, `updatedAt`) VALUES
(1, 3, 4, @t2, @t2),
(2, 5, 6, @t3, @t3),
(3, 5, 4, @t1, @t1);

INSERT INTO `resumes` (`id`, `executerId`, `title`, `description`, `experience`, `education`, `skills`, `portfolio`, `isActive`, `isApproved`, `createdAt`, `updatedAt`) VALUES
(1, 4, 'Веб-разработчик', 'SPA, личные кабинеты.', '4 года.', 'Курсы.', 'React, TS, Node.', 'https://example.com/ex', 1, 1, @t0, @t1),
(2, 6, 'Дизайнер UI', 'Figma, презентации.', '6 лет.', 'БГУИР.', 'Figma, AE.', 'https://behance.example/s', 1, 1, @t0, @t2);

INSERT INTO `chats` (`id`, `user1Id`, `user2Id`, `lastMessageAt`, `createdAt`, `updatedAt`) VALUES
(1, 3, 4, '2026-01-16 10:05:00', '2026-01-15 16:00:00', '2026-01-16 10:05:00'),
(2, 5, 4, '2026-01-18 14:20:00', '2026-01-17 11:00:00', '2026-01-18 14:20:00'),
(3, 7, 5, '2026-01-21 09:40:00', '2026-01-21 08:30:00', '2026-01-21 09:40:00');

INSERT INTO `messages` (`id`, `chatId`, `senderId`, `content`, `isRead`, `readAt`, `createdAt`, `updatedAt`, `isType`) VALUES
(1, 1, 3, 'Добрый день! Есть макет в Figma, уложимся в две недели?', 1, '2026-01-15 17:00:00', '2026-01-15 16:02:00', '2026-01-15 17:00:00', 'user'),
(2, 1, 4, 'Добрый день. Да, при текущем объёме — да.', 1, '2026-01-16 09:00:00', '2026-01-15 18:10:00', '2026-01-16 09:00:00', 'user'),
(3, 1, 3, 'Отлично, жду смету этапов.', 1, '2026-01-16 10:06:00', '2026-01-16 10:05:00', '2026-01-16 10:06:00', 'user'),
(4, 2, 5, 'Пришлите билд с багом пагинации.', 0, NULL, '2026-01-17 11:05:00', '2026-01-17 11:05:00', 'user'),
(5, 2, 4, 'Приглашение на GitHub отправил.', 1, '2026-01-18 14:21:00', '2026-01-17 16:40:00', '2026-01-18 14:21:00', 'user'),
(6, 3, 5, 'Уточните ИНН для тикета.', 1, '2026-01-21 09:41:00', '2026-01-21 08:35:00', '2026-01-21 09:41:00', 'user'),
(7, 3, 7, 'ИНН отправлю с корпоративной почты.', 0, NULL, '2026-01-21 09:40:00', '2026-01-21 09:40:00', 'user');

INSERT INTO `notifications` (`id`, `userId`, `type`, `title`, `message`, `relatedId`, `relatedType`, `isRead`, `readAt`, `createdAt`, `updatedAt`) VALUES
(1, 4, 'new_application', 'Новый отклик', 'Отклик по заказу кабинета.', 2, 'order', 0, NULL, @t2, @t2),
(2, 5, 'new_message', 'Новое сообщение', 'executer: GitHub.', 2, 'message', 1, '2026-01-18 15:00:00', @t2, @t2),
(3, 5, 'application_approved', 'Отклик одобрен', 'По заказу SMM.', 3, 'order', 1, '2026-02-02 12:00:00', @t3, @t3),
(4, 3, 'order_status_changed', 'Статус заказа', 'Заказ учёт ИП.', 4, 'order', 0, NULL, @t2, @t2),
(5, 4, 'new_rating', 'Оценка', 'По заказу лендинг.', 1, 'rating', 0, NULL, @t3, @t3),
(6, 6, 'service_status_changed', 'Услуга', 'Обложка снята с публикации.', 5, 'service', 1, '2026-01-22 10:00:00', @t3, @t3),
(7, 4, 'resume_approved', 'Резюме', 'Резюме одобрено.', 1, 'resume', 1, '2026-01-06 12:00:00', @t1, @t1),
(8, 3, 'system', 'Памятка', 'Сохраните ТЗ в заказе.', NULL, NULL, 0, NULL, @t1, @t1);

INSERT INTO `ratings` (`id`, `fromUserId`, `toUserId`, `orderId`, `serviceId`, `rating`, `comment`, `createdAt`, `updatedAt`) VALUES
(1, 3, 4, 1, NULL, 5, 'Сроки соблюдены.', @t2, @t2),
(2, 5, 6, 3, NULL, 5, 'Отличный SMM.', @t3, @t3),
(3, 5, 4, NULL, NULL, 4, 'Хорошо, небольшая задержка.', @t2, @t2),
(4, 3, 6, NULL, 3, 5, 'UI-kit супер.', @t3, @t3);

INSERT INTO `tickets` (`id`, `userId`, `subject`, `description`, `category`, `status`, `priority`, `assignedManagerId`, `createdAt`, `updatedAt`) VALUES
(1, 5, 'Письмо восстановления пароля', 'Не приходит на bk.ru.', 'technical', 'in_progress', 'high', 7, @t2, @t3),
(2, 3, 'Комиссия площадки', 'Вопрос по удержанию.', 'payment', 'open', 'medium', 7, @t3, @t3),
(3, 2, 'Дублирование сообщений в чате', 'Три раза одно и то же.', 'technical', 'resolved', 'low', 7, @t1, @t2);

INSERT INTO `disputes` (`id`, `orderId`, `applicationId`, `customerId`, `executerId`, `initiatorId`, `reason`, `description`, `status`, `resolution`, `resolutionComment`, `resolvedByManagerId`, `createdAt`, `updatedAt`) VALUES
(1, 5, NULL, 2, 6, 2, 'Объём этапа 2', 'Спор о правках и доплате.', 'in_review', NULL, NULL, NULL, @t3, @t3),
(2, 3, NULL, 5, 6, 5, 'Отчёт SMM', 'Отчёт с задержкой.', 'resolved', 'split', 'Компенсация двумя постами.', 7, @t2, @t3);

INSERT INTO `reports` (`id`, `reporterId`, `targetId`, `targetType`, `reason`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 5, 2, 'user', 'Шаблонные отклики.', 'pending', @t2, @t2),
(2, 3, 5, 'service', 'Сроки в описании вводят в заблуждение.', 'pending', @t3, @t3),
(3, 3, 2, 'order', 'Прошу скрыть дубликат из поиска.', 'resolved', @t1, @t1);

ALTER TABLE `users` AUTO_INCREMENT = 8;
ALTER TABLE `skills` AUTO_INCREMENT = 26;
ALTER TABLE `categories` AUTO_INCREMENT = 11;
ALTER TABLE `profiles` AUTO_INCREMENT = 8;
ALTER TABLE `contacts` AUTO_INCREMENT = 4;
ALTER TABLE `orders` AUTO_INCREMENT = 6;
ALTER TABLE `services` AUTO_INCREMENT = 7;
ALTER TABLE `applications` AUTO_INCREMENT = 7;
ALTER TABLE `attachments` AUTO_INCREMENT = 6;
ALTER TABLE `favorites` AUTO_INCREMENT = 4;
ALTER TABLE `resumes` AUTO_INCREMENT = 3;
ALTER TABLE `chats` AUTO_INCREMENT = 4;
ALTER TABLE `messages` AUTO_INCREMENT = 8;
ALTER TABLE `notifications` AUTO_INCREMENT = 9;
ALTER TABLE `ratings` AUTO_INCREMENT = 5;
ALTER TABLE `tickets` AUTO_INCREMENT = 4;
ALTER TABLE `disputes` AUTO_INCREMENT = 3;
ALTER TABLE `reports` AUTO_INCREMENT = 4;

SET FOREIGN_KEY_CHECKS = 1;
