/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.11-MariaDB, for debian-linux-gnu (aarch64)
--
-- Host: 10.2.3.124    Database: b7store
-- ------------------------------------------------------
-- Server version	10.11.11-MariaDB-0+deb12u1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categories`
--
use b7store;

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `category_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `uq_categories_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES
(1,'Gewindeschrauben','Metall Gewindeschrauben'),
(2,'Holzschrauben','Spax Schrauben');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `item_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `category_id` int(10) unsigned NOT NULL,
  `name` varchar(200) NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  KEY `idx_items_category_id` (`category_id`),
  CONSTRAINT `fk_items_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES
(96,1,'Mutter M3',NULL),
(97,1,'Mutter M4',NULL),
(98,1,'Mutter M5',NULL),
(99,1,'Mutter M6',NULL),
(100,1,'Mutter M8',NULL),
(101,1,'Gewindeschraube 3x20mm',NULL),
(102,1,'Gewindeschraube 4x8mm',NULL),
(103,1,'Gewindeschraube 4X10mm',NULL),
(104,1,'Gewindeschraube 4x12mm',NULL),
(105,1,'Gewindeschraube 4x15mm',NULL),
(106,1,'Gewindeschraube 4x18mm',NULL),
(107,1,'Gewindeschraube 4x25mm',NULL),
(108,1,'Gewindeschraube 4X30mm',NULL),
(109,1,'Gewindeschraube 4x40mm',NULL),
(110,1,'Gewindeschraube 5x20mm',NULL),
(111,1,'Gewindeschraube 5x25mm',NULL),
(112,1,'Gewindeschraube 5x30mm',NULL),
(113,1,'Gewindeschraube 6X20mm',NULL),
(114,1,'Gewindeschraube 6x25mm',NULL),
(115,1,'Gewindeschraube 6x30mm',NULL),
(116,1,'Gewindeschraube 6x40mm',NULL),
(117,1,'Gewindeschraube 6X50mm',NULL),
(118,1,'Gewindeschraube 8x15mm',NULL);
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `locations` (
  `location_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`location_id`),
  UNIQUE KEY `uq_locations_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
INSERT INTO `locations` VALUES
(1,'container1','Der rechte Werkzeugcontainer'),
(2,'container2','Der linke Werkzeugcontainer'),
(3,'Schrank','Der Schrank hinter dem rechten Werkzeugcontainer');
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `screws`
--

DROP TABLE IF EXISTS `screws`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `screws` (
  `item_id` int(10) unsigned NOT NULL,
  `diameter` varchar(10) NOT NULL,
  `length_mm` int(11) NOT NULL,
  `head_type` varchar(30) NOT NULL,
  `drive` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  CONSTRAINT `fk_screws_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `screws`
--

LOCK TABLES `screws` WRITE;
/*!40000 ALTER TABLE `screws` DISABLE KEYS */;
INSERT INTO `screws` VALUES
(101,'3',20,'Flachkopf','Schlitz'),
(102,'4',8,'Flachkopf','Schlitz'),
(103,'4',10,'Flachkopf','Schlitz'),
(104,'4',12,'Flachkopf','Schlitz'),
(105,'4',15,'Flachkopf','Schlitz'),
(106,'4',18,'Flachkopf','Schlitz'),
(107,'4',25,'Flachkopf','Schlitz'),
(108,'4',30,'Flachkopf','Schlitz'),
(109,'4',40,'Flachkopf','Schlitz'),
(110,'5',20,'Flachkopf','Schlitz'),
(111,'5',25,'Flachkopf','Schlitz'),
(112,'5',30,'Flachkopf','Schlitz'),
(113,'6',20,'Flachkopf','Schlitz'),
(114,'6',25,'Flachkopf','Schlitz'),
(115,'6',30,'Flachkopf','Schlitz'),
(116,'6',40,'Flachkopf','Schlitz'),
(117,'5',50,'Flachkopf','Schlitz'),
(118,'8',15,'Flachkopf','Schlitz');
/*!40000 ALTER TABLE `screws` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock`
--

DROP TABLE IF EXISTS `stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock` (
  `stock_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `item_id` int(10) unsigned NOT NULL,
  `location_id` int(10) unsigned NOT NULL,
  `quantity` decimal(12,3) NOT NULL DEFAULT 0.000,
  `unit` varchar(10) NOT NULL,
  PRIMARY KEY (`stock_id`),
  KEY `idx_stock_item_id` (`item_id`),
  KEY `idx_stock_location_id` (`location_id`),
  CONSTRAINT `fk_stock_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_stock_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`location_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock`
--

LOCK TABLES `stock` WRITE;
/*!40000 ALTER TABLE `stock` DISABLE KEYS */;
INSERT INTO `stock` VALUES
(1,106,3,118.000,'-'),
(2,107,3,71.000,'-'),
(3,101,3,32.000,'-'),
(4,102,3,10.000,'-'),
(5,103,3,41.000,'-'),
(6,104,3,37.000,'-'),
(7,105,3,34.000,'-'),
(8,111,3,43.000,'-'),
(9,108,3,48.000,'-'),
(10,109,3,10.000,'-'),
(11,110,3,38.000,'-'),
(12,112,3,38.000,'-'),
(13,117,3,17.000,'-'),
(14,116,3,9.000,'-'),
(15,115,3,39.000,'-'),
(16,114,3,22.000,'-'),
(17,113,3,60.000,'-'),
(18,118,3,16.000,'-'),
(19,96,3,126.000,'-'),
(20,97,3,412.000,'-'),
(21,98,3,61.000,'-'),
(22,99,3,225.000,'-'),
(23,100,3,48.000,'-');
/*!40000 ALTER TABLE `stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `threaded_rods`
--

DROP TABLE IF EXISTS `threaded_rods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `threaded_rods` (
  `item_id` int(10) unsigned NOT NULL,
  `diameter` varchar(10) NOT NULL,
  `length_mm` int(11) NOT NULL,
  `material` varchar(50) DEFAULT NULL,
  `finish` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  CONSTRAINT `fk_rods_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `threaded_rods`
--

LOCK TABLES `threaded_rods` WRITE;
/*!40000 ALTER TABLE `threaded_rods` DISABLE KEYS */;
/*!40000 ALTER TABLE `threaded_rods` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-06 13:15:29
