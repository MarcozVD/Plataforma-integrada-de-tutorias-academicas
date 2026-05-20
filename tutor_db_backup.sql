-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: tutor_db
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `interest_subjects`
--

DROP TABLE IF EXISTS `interest_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `interest_subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `university_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_subject` (`university_id`,`subject_name`),
  KEY `ix_interest_subjects_id` (`id`),
  CONSTRAINT `interest_subjects_ibfk_1` FOREIGN KEY (`university_id`) REFERENCES `users` (`university_id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `interest_subjects`
--

LOCK TABLES `interest_subjects` WRITE;
/*!40000 ALTER TABLE `interest_subjects` DISABLE KEYS */;
INSERT INTO `interest_subjects` VALUES (2,'U00177223','Bases de Datos','2026-03-01 16:50:33'),(17,'U00177221','Física II','2026-03-02 11:50:34'),(18,'U00177221','Redes de Computadoras','2026-03-02 11:50:34'),(28,'U00177222','Cálculo II','2026-03-29 13:07:05'),(29,'U00177222','Estructura de Datos','2026-03-29 13:07:05'),(30,'U00177222','Física I','2026-03-29 13:07:05'),(31,'U00177222','Programación I','2026-03-29 13:07:05'),(32,'U00177222','Redes de Computadoras','2026-03-29 13:07:05'),(33,'U00177222','h','2026-03-29 13:07:05');
/*!40000 ALTER TABLE `interest_subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_password_reset_tokens_token` (`token`),
  KEY `user_id` (`user_id`),
  KEY `ix_password_reset_tokens_id` (`id`),
  CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room_availabilities`
--

DROP TABLE IF EXISTS `room_availabilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_availabilities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `day` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_time` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL,
  `end_time` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL,
  `specific_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_room_availabilities_room_id` (`room_id`),
  KEY `ix_room_availabilities_id` (`id`),
  CONSTRAINT `room_availabilities_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room_availabilities`
--

LOCK TABLES `room_availabilities` WRITE;
/*!40000 ALTER TABLE `room_availabilities` DISABLE KEYS */;
/*!40000 ALTER TABLE `room_availabilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `building` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` int DEFAULT NULL,
  `available` tinyint(1) DEFAULT NULL,
  `accessibility_wheelchair` tinyint(1) DEFAULT NULL,
  `accessibility_visual` tinyint(1) DEFAULT NULL,
  `accessibility_hearing` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `ix_rooms_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (11,'A-21','Bloque A',30,1,0,0,0,'2026-03-03 10:57:56'),(13,'A-22','Bloque A',30,1,0,0,0,'2026-03-03 10:58:34'),(14,'B-21','Bloque B',30,1,0,0,0,'2026-03-04 09:11:13'),(15,'A-43','Bloque A',30,1,0,0,0,'2026-03-04 09:25:43'),(16,'C-23','Bloque C',30,1,0,0,0,'2026-03-04 09:28:10'),(17,'A-12','Bloque A',30,1,0,0,0,'2026-03-04 09:39:10'),(18,'L-31','Bloque L',30,1,0,0,0,'2026-03-14 20:33:25'),(19,'A-89','Bloque A',30,1,1,1,1,'2026-03-29 13:08:13'),(20,'L-201','Bloque L',30,1,1,1,0,'2026-05-19 11:03:27'),(21,'L-205','Bloque L',25,1,0,1,0,'2026-05-19 11:03:27'),(22,'L-301','Bloque L',40,1,0,0,0,'2026-05-19 11:03:27'),(23,'L-305','Bloque L',35,1,1,0,1,'2026-05-19 11:03:27'),(24,'L-401','Bloque L',30,1,1,1,1,'2026-05-19 11:03:27'),(25,'L-402','Bloque L',30,1,1,0,0,'2026-05-19 11:03:27'),(26,'B-101','Bloque B',50,1,1,1,1,'2026-05-19 11:03:27'),(27,'B-203','Bloque B',25,1,0,0,1,'2026-05-19 11:03:27'),(28,'C-101','Bloque C',45,1,1,1,1,'2026-05-19 11:03:27'),(29,'A-201','Bloque A',20,1,0,0,0,'2026-05-19 11:03:27'),(30,'A-105','Bloque A',35,1,1,0,1,'2026-05-19 11:03:27'),(31,'D-301','Bloque D',60,1,1,1,0,'2026-05-19 11:03:27');
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tutor_ratings`
--

DROP TABLE IF EXISTS `tutor_ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tutor_ratings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `tutor_id` int NOT NULL,
  `session_id` int NOT NULL,
  `stars` int NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_session_rating` (`student_id`,`session_id`),
  KEY `tutor_id` (`tutor_id`),
  KEY `session_id` (`session_id`),
  KEY `ix_tutor_ratings_id` (`id`),
  CONSTRAINT `tutor_ratings_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`),
  CONSTRAINT `tutor_ratings_ibfk_2` FOREIGN KEY (`tutor_id`) REFERENCES `users` (`id`),
  CONSTRAINT `tutor_ratings_ibfk_3` FOREIGN KEY (`session_id`) REFERENCES `tutoring_sessions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tutor_ratings`
--

LOCK TABLES `tutor_ratings` WRITE;
/*!40000 ALTER TABLE `tutor_ratings` DISABLE KEYS */;
/*!40000 ALTER TABLE `tutor_ratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tutoring_enrollments`
--

DROP TABLE IF EXISTS `tutoring_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tutoring_enrollments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `session_id` int NOT NULL,
  `created_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_session_enrollment` (`student_id`,`session_id`),
  KEY `session_id` (`session_id`),
  KEY `ix_tutoring_enrollments_id` (`id`),
  CONSTRAINT `tutoring_enrollments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`),
  CONSTRAINT `tutoring_enrollments_ibfk_2` FOREIGN KEY (`session_id`) REFERENCES `tutoring_sessions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tutoring_enrollments`
--

LOCK TABLES `tutoring_enrollments` WRITE;
/*!40000 ALTER TABLE `tutoring_enrollments` DISABLE KEYS */;
INSERT INTO `tutoring_enrollments` VALUES (3,1,1,'2026-03-02 11:10:36'),(4,2,1,'2026-03-02 11:50:05'),(5,2,2,'2026-03-02 11:50:06'),(6,1,2,'2026-03-02 11:51:11'),(7,5,1,'2026-03-14 20:31:05'),(8,2,3,'2026-03-29 13:13:02'),(10,9,5,'2026-05-19 11:00:44'),(11,10,5,'2026-05-19 11:00:44'),(12,11,5,'2026-05-19 11:00:44'),(13,12,5,'2026-05-19 11:00:44'),(14,13,5,'2026-05-19 11:00:44'),(15,14,5,'2026-05-19 11:00:44'),(16,15,6,'2026-05-19 11:00:44'),(17,16,6,'2026-05-19 11:00:44'),(18,9,7,'2026-05-19 11:00:44'),(19,11,7,'2026-05-19 11:00:44'),(20,13,7,'2026-05-19 11:00:44'),(21,16,7,'2026-05-19 11:00:44'),(22,10,8,'2026-05-19 11:00:44'),(23,14,8,'2026-05-19 11:00:44'),(24,9,9,'2026-05-19 11:00:44'),(25,10,9,'2026-05-19 11:00:44'),(26,11,9,'2026-05-19 11:00:44'),(27,12,9,'2026-05-19 11:00:44'),(28,13,9,'2026-05-19 11:00:44'),(29,14,9,'2026-05-19 11:00:44'),(30,15,9,'2026-05-19 11:00:44'),(31,16,10,'2026-05-19 11:00:44'),(32,9,11,'2026-05-19 11:00:44'),(33,12,11,'2026-05-19 11:00:44'),(34,14,11,'2026-05-19 11:00:44'),(35,10,12,'2026-05-19 11:00:44'),(36,11,12,'2026-05-19 11:00:44'),(37,13,12,'2026-05-19 11:00:44'),(38,15,12,'2026-05-19 11:00:44'),(39,9,13,'2026-05-19 11:00:44'),(40,10,13,'2026-05-19 11:00:44'),(41,12,13,'2026-05-19 11:00:44'),(42,11,14,'2026-05-19 11:00:44'),(43,13,14,'2026-05-19 11:00:44'),(44,14,14,'2026-05-19 11:00:44'),(45,16,14,'2026-05-19 11:00:44'),(46,9,15,'2026-05-19 11:00:44'),(47,15,15,'2026-05-19 11:00:44'),(48,11,15,'2026-05-19 11:00:44'),(49,12,15,'2026-05-19 11:00:44'),(50,14,15,'2026-05-19 11:00:44'),(51,10,16,'2026-05-19 11:00:44'),(52,1,5,'2026-05-19 11:04:58'),(53,1,15,'2026-05-19 11:18:08'),(54,1,14,'2026-05-19 11:18:08');
/*!40000 ALTER TABLE `tutoring_enrollments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tutoring_preferences`
--

DROP TABLE IF EXISTS `tutoring_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tutoring_preferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `university_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preference_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `enabled` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_preference` (`university_id`,`preference_type`),
  KEY `ix_tutoring_preferences_id` (`id`),
  CONSTRAINT `tutoring_preferences_ibfk_1` FOREIGN KEY (`university_id`) REFERENCES `users` (`university_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tutoring_preferences`
--

LOCK TABLES `tutoring_preferences` WRITE;
/*!40000 ALTER TABLE `tutoring_preferences` DISABLE KEYS */;
INSERT INTO `tutoring_preferences` VALUES (1,'U00177223','afternoon',1,'2026-03-01 16:50:33'),(7,'U00177222','morning',1,'2026-03-29 13:07:05');
/*!40000 ALTER TABLE `tutoring_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tutoring_sessions`
--

DROP TABLE IF EXISTS `tutoring_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tutoring_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tutor_id` int NOT NULL,
  `subject` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_time` datetime NOT NULL,
  `duration` int DEFAULT NULL,
  `spots` int DEFAULT NULL,
  `spots_available` int DEFAULT NULL,
  `room` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accessibility_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `tutor_id` (`tutor_id`),
  KEY `ix_tutoring_sessions_id` (`id`),
  CONSTRAINT `tutoring_sessions_ibfk_1` FOREIGN KEY (`tutor_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tutoring_sessions`
--

LOCK TABLES `tutoring_sessions` WRITE;
/*!40000 ALTER TABLE `tutoring_sessions` DISABLE KEYS */;
INSERT INTO `tutoring_sessions` VALUES (1,3,'Física I','2026-03-03 13:14:00',60,6,3,'L21',NULL,'2026-03-02 10:14:44'),(2,3,'Programación I','2026-03-02 14:00:00',120,15,13,'L23','','2026-03-02 11:49:10'),(3,3,'Cálculo II','2026-03-30 08:00:00',60,5,4,'A-89','','2026-03-29 13:11:36'),(4,3,'Cálculo II','2026-05-19 14:00:00',60,5,5,'A-21','Movilidad reducida','2026-05-19 10:55:36'),(5,6,'Cálculo I','2026-05-20 10:00:00',90,8,1,'L-201',NULL,'2026-05-19 11:00:44'),(6,6,'Cálculo I','2026-05-23 14:00:00',90,8,6,'L-201',NULL,'2026-05-19 11:00:44'),(7,6,'Álgebra Lineal','2026-05-25 09:00:00',60,6,2,'L-205','visual','2026-05-19 11:00:44'),(8,6,'Cálculo II','2026-05-28 13:00:00',90,6,4,'L-201',NULL,'2026-05-19 11:00:44'),(9,7,'Física II','2026-05-21 08:00:00',120,10,3,'B-101','auditiva','2026-05-19 11:00:44'),(10,7,'Física II','2026-05-27 15:00:00',120,10,9,'B-101','auditiva','2026-05-19 11:00:44'),(11,7,'Programación en Python','2026-05-22 11:00:00',90,8,5,'L-301',NULL,'2026-05-19 11:00:44'),(12,7,'Termodinámica','2026-05-30 16:00:00',60,5,1,'B-203',NULL,'2026-05-19 11:00:44'),(13,8,'Estructuras de Datos','2026-05-20 15:00:00',60,6,3,'L-401',NULL,'2026-05-19 11:00:44'),(14,8,'Estructuras de Datos','2026-05-26 10:00:00',60,6,1,'L-401',NULL,'2026-05-19 11:00:44'),(15,8,'Bases de Datos','2026-05-23 09:00:00',90,8,2,'L-305','motriz','2026-05-19 11:00:44'),(16,8,'Diseño de Software','2026-06-01 11:00:00',90,8,7,'L-402',NULL,'2026-05-19 11:00:44');
/*!40000 ALTER TABLE `tutoring_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_disabilities`
--

DROP TABLE IF EXISTS `user_disabilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_disabilities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `university_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `disability_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `disability_description` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT (now()),
  `updated_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`university_id`),
  KEY `ix_user_disabilities_id` (`id`),
  CONSTRAINT `user_disabilities_ibfk_1` FOREIGN KEY (`university_id`) REFERENCES `users` (`university_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_disabilities`
--

LOCK TABLES `user_disabilities` WRITE;
/*!40000 ALTER TABLE `user_disabilities` DISABLE KEYS */;
INSERT INTO `user_disabilities` VALUES (1,'20180001','visual','Experiencia con estudiantes con discapacidad visual','2026-05-19 11:00:44','2026-05-19 11:00:44'),(2,'20170045','auditiva','Maneja lenguaje de señas colombiano','2026-05-19 11:00:44','2026-05-19 11:00:44'),(3,'20230001','visual','Baja visión, necesita presentaciones con fuente grande','2026-05-19 11:00:44','2026-05-19 11:00:44'),(4,'20230004','auditiva','Hipoacusia bilateral moderada','2026-05-19 11:00:44','2026-05-19 11:00:44'),(5,'20230007','motriz','Movilidad reducida en miembros superiores','2026-05-19 11:00:44','2026-05-19 11:00:44');
/*!40000 ALTER TABLE `user_disabilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `university_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hashed_password` varchar(256) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `carrera` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_users_email` (`email`),
  UNIQUE KEY `ix_users_student_id` (`university_id`),
  KEY `ix_users_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'U00177223','marcos','mvaleradaza@gmail.com','$2b$12$agNRoPiqEn8tL8pPsLkXw.0pyMxZPhIrBjDhnyBUHErFKDRWEDtFi','student','Ingeniería de Sistemas','2026-03-01 16:44:40'),(2,'U00177221','juan','maria.lopez@instituto.edu','$2b$12$yu3zsRLnj6FO6mGxjYgsiOC2J6HGCNLcNl.daZskb8mboAORmAlQ6','student','Ingeniería de Sistemas','2026-03-01 19:36:48'),(3,'U00177222','mayra','laura.martinez@example.com','$2b$12$QiHmfH3gQf9dakoq7Vh7w.tIwPLNrzRNTCl5.OjgpDsbikee6KNCi','tutor','Ingeniería de Sistemas','2026-03-02 09:59:49'),(4,'admin','Administrador PITA','admin@pita.edu.co','$2b$12$CkVQ51pTmRQ3XGBn7o1GkupegyDLy8oi1O7EEDDjtEdS7iki7wiEm','admin',NULL,'2026-03-02 11:55:02'),(5,'U00177224','andres','hola@gmail.com','$2b$12$XnOrkaTIaaTkxF.T/2CQheQ7GVD8vcsqRKaffVwrZqvS8kJe2yi5q','student','Derecho','2026-03-14 20:30:07'),(6,'20180001','Carlos Mendoza Ruiz','carlos.mendoza@unab.edu.co','$2b$12$8ACJ1/8YOHck68cQtLgJyuLDu3d/N3yXV0CIxsKkFnCzcpwfOjEJ6','tutor','Ingeniería de Sistemas','2026-05-19 11:00:44'),(7,'20170045','Ana García Peña','ana.garcia@unab.edu.co','$2b$12$8ACJ1/8YOHck68cQtLgJyuLDu3d/N3yXV0CIxsKkFnCzcpwfOjEJ6','tutor','Ingeniería Industrial','2026-05-19 11:00:44'),(8,'20160089','Roberto Silva Mora','roberto.silva@unab.edu.co','$2b$12$8ACJ1/8YOHck68cQtLgJyuLDu3d/N3yXV0CIxsKkFnCzcpwfOjEJ6','tutor','Ingeniería Civil','2026-05-19 11:00:44'),(9,'20230001','Juan Pérez González','juan.perez@unab.edu.co','$2b$12$8ACJ1/8YOHck68cQtLgJyuLDu3d/N3yXV0CIxsKkFnCzcpwfOjEJ6','student','Ingeniería de Sistemas','2026-05-19 11:00:44'),(10,'20230002','María López Castro','maria.lopez@unab.edu.co','$2b$12$8ACJ1/8YOHck68cQtLgJyuLDu3d/N3yXV0CIxsKkFnCzcpwfOjEJ6','student','Ingeniería Industrial','2026-05-19 11:00:44'),(11,'20230003','Diego Rodríguez Vargas','diego.rodriguez@unab.edu.co','$2b$12$8ACJ1/8YOHck68cQtLgJyuLDu3d/N3yXV0CIxsKkFnCzcpwfOjEJ6','student','Derecho','2026-05-19 11:00:44'),(12,'20230004','Valentina Torres Ríos','valentina.torres@unab.edu.co','$2b$12$8ACJ1/8YOHck68cQtLgJyuLDu3d/N3yXV0CIxsKkFnCzcpwfOjEJ6','student','Medicina','2026-05-19 11:00:44'),(13,'20230005','Andrés Gómez Prada','andres.gomez@unab.edu.co','$2b$12$8ACJ1/8YOHck68cQtLgJyuLDu3d/N3yXV0CIxsKkFnCzcpwfOjEJ6','student','Ingeniería de Sistemas','2026-05-19 11:00:44'),(14,'20230006','Sofía Martínez Luna','sofia.martinez@unab.edu.co','$2b$12$8ACJ1/8YOHck68cQtLgJyuLDu3d/N3yXV0CIxsKkFnCzcpwfOjEJ6','student','Administración','2026-05-19 11:00:44'),(15,'20230007','Camilo Herrera Díaz','camilo.herrera@unab.edu.co','$2b$12$8ACJ1/8YOHck68cQtLgJyuLDu3d/N3yXV0CIxsKkFnCzcpwfOjEJ6','student','Ingeniería Civil','2026-05-19 11:00:44'),(16,'20230008','Laura Castillo Ávila','laura.castillo@unab.edu.co','$2b$12$8ACJ1/8YOHck68cQtLgJyuLDu3d/N3yXV0CIxsKkFnCzcpwfOjEJ6','student','Contabilidad','2026-05-19 11:00:44');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `waitlist_entries`
--

DROP TABLE IF EXISTS `waitlist_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `waitlist_entries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `session_id` int NOT NULL,
  `position` int NOT NULL,
  `notified` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_session_waitlist` (`student_id`,`session_id`),
  KEY `session_id` (`session_id`),
  KEY `ix_waitlist_entries_id` (`id`),
  CONSTRAINT `waitlist_entries_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`),
  CONSTRAINT `waitlist_entries_ibfk_2` FOREIGN KEY (`session_id`) REFERENCES `tutoring_sessions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `waitlist_entries`
--

LOCK TABLES `waitlist_entries` WRITE;
/*!40000 ALTER TABLE `waitlist_entries` DISABLE KEYS */;
/*!40000 ALTER TABLE `waitlist_entries` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-20 11:10:30
