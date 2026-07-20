CREATE TABLE `magazine_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`magazineId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `magazine_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `share_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`magazineId` int NOT NULL,
	`userId` int NOT NULL,
	`shortCode` varchar(12) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `share_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `share_links_shortCode_unique` UNIQUE(`shortCode`)
);
