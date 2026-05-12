CREATE TABLE `combos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`original_price` decimal(10,2),
	`image_url` varchar(500),
	`theme` varchar(30) NOT NULL DEFAULT 'geral',
	`feature_home` tinyint NOT NULL DEFAULT 1,
	`is_active` tinyint NOT NULL DEFAULT 1,
	`valid_from` timestamp,
	`valid_until` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `combos_id` PRIMARY KEY(`id`),
	CONSTRAINT `combos_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `combos_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `combo_items` (
	`combo_id` int NOT NULL,
	`product_id` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`display_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `combo_items_combo_id_product_id_pk` PRIMARY KEY(`combo_id`,`product_id`)
);
--> statement-breakpoint
ALTER TABLE `combo_items` ADD CONSTRAINT `combo_items_combo_id_combos_id_fk` FOREIGN KEY (`combo_id`) REFERENCES `combos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `combo_items` ADD CONSTRAINT `combo_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `combos_is_active_idx` ON `combos` (`is_active`);--> statement-breakpoint
CREATE INDEX `combos_validity_idx` ON `combos` (`is_active`,`valid_from`,`valid_until`);