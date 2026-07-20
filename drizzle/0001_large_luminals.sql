CREATE TABLE `article_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`imageIndex` int NOT NULL,
	`imageType` enum('logo','gameplay','artwork') NOT NULL,
	`prompt` text,
	`imageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `article_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`magazineId` int NOT NULL,
	`articleIndex` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text,
	`tips` text,
	`contentPrompt` text,
	`tipsPrompt` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `articles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `editorial_concepts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conceptData` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `editorial_concepts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `magazine_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`magazineId` int NOT NULL,
	`versionData` json NOT NULL,
	`versionLabel` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `magazine_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `magazines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`coverImageUrl` text,
	`coverImagePrompt` text,
	`logoUrl` text,
	`gameOfTheWeekTitle` varchar(500),
	`gameOfTheWeekDescription` text,
	`gameOfTheWeekImagePrompt` text,
	`gameOfTheWeekImageUrl` text,
	`structureData` json,
	`status` enum('draft','generating','complete') NOT NULL DEFAULT 'draft',
	`isDeepMode` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `magazines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visual_identities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`magazineName` varchar(255) NOT NULL,
	`logoUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `visual_identities_id` PRIMARY KEY(`id`)
);
