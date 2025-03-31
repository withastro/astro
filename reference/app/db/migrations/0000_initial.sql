-- CreateTable
CREATE TABLE IF NOT EXISTS `translations` (
  `id` varchar(255) NOT NULL,
  `locale` varchar(10) NOT NULL,
  `namespace` varchar(50) NOT NULL,
  `key` varchar(255) NOT NULL,
  `value` text NOT NULL,
  `lastUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`locale`, `namespace`, `key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `translations_locale_idx` ON `translations`(`locale`);
CREATE INDEX `translations_namespace_idx` ON `translations`(`namespace`);

-- InsertSampleData
INSERT INTO `translations` (`id`, `locale`, `namespace`, `key`, `value`) VALUES
('1', 'de', 'common', 'welcome', 'Willkommen bei unserer Enterprise App'),
('2', 'de', 'common', 'dashboard', 'Dashboard'),
('3', 'de', 'common', 'projects', 'Projekte'),
('4', 'de', 'common', 'settings', 'Einstellungen'),
('5', 'en', 'common', 'welcome', 'Welcome to our Enterprise App'),
('6', 'en', 'common', 'dashboard', 'Dashboard'),
('7', 'en', 'common', 'projects', 'Projects'),
('8', 'en', 'common', 'settings', 'Settings'); 