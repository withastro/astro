-- Migration: Add slug unique constraints for localized content
-- Description: This migration adds composite unique constraints to ensure 
-- slug uniqueness within each locale for different content types

-- Create blog_translations table if it doesn't exist
CREATE TABLE IF NOT EXISTS `blog_translations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `blog_id` bigint NOT NULL,
  `locale` varchar(5) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_blog_id` (`blog_id`),
  KEY `idx_locale` (`locale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create project_translations table if it doesn't exist
CREATE TABLE IF NOT EXISTS `project_translations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `project_id` bigint NOT NULL,
  `locale` varchar(5) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_locale` (`locale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create content_category_translations table if it doesn't exist
CREATE TABLE IF NOT EXISTS `content_category_translations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category_id` bigint NOT NULL,
  `locale` varchar(5) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_locale` (`locale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create page_translations table if it doesn't exist
CREATE TABLE IF NOT EXISTS `page_translations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `page_id` bigint NOT NULL,
  `locale` varchar(5) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `meta_description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_page_id` (`page_id`),
  KEY `idx_locale` (`locale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add unique constraints for slug-locale combinations
ALTER TABLE `blog_translations` ADD UNIQUE KEY `unique_locale_slug` (`locale`, `slug`);
ALTER TABLE `project_translations` ADD UNIQUE KEY `unique_locale_slug` (`locale`, `slug`);
ALTER TABLE `content_category_translations` ADD UNIQUE KEY `unique_locale_slug` (`locale`, `slug`);
ALTER TABLE `page_translations` ADD UNIQUE KEY `unique_locale_slug` (`locale`, `slug`);

-- Add a procedure to check for and resolve existing duplicate slugs
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS `check_and_resolve_duplicate_slugs`()
BEGIN
    DECLARE table_name VARCHAR(255);
    DECLARE done INT DEFAULT FALSE;
    DECLARE cur CURSOR FOR
        SELECT 'blog_translations' UNION
        SELECT 'project_translations' UNION
        SELECT 'content_category_translations' UNION
        SELECT 'page_translations';
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO table_name;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        SET @sql = CONCAT('
            CREATE TEMPORARY TABLE IF NOT EXISTS temp_duplicates AS
            SELECT t1.id, t1.locale, t1.slug, CONCAT(t1.slug, "-", t1.id) AS new_slug
            FROM ', table_name, ' t1
            JOIN (
                SELECT locale, slug, COUNT(*) as count
                FROM ', table_name, '
                GROUP BY locale, slug
                HAVING count > 1
            ) t2 ON t1.locale = t2.locale AND t1.slug = t2.slug
            ORDER BY t1.id DESC;
            
            UPDATE ', table_name, ' t
            JOIN temp_duplicates d ON t.id = d.id
            SET t.slug = d.new_slug;
            
            DROP TEMPORARY TABLE IF EXISTS temp_duplicates;
        ');
        
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END LOOP;
    
    CLOSE cur;
END //
DELIMITER ;

-- Execute the procedure to resolve any existing duplicates
CALL check_and_resolve_duplicate_slugs();

-- Drop the procedure after use
DROP PROCEDURE IF EXISTS check_and_resolve_duplicate_slugs; 