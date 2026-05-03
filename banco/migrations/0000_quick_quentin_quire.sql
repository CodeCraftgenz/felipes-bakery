CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`provider` enum('mercadopago') NOT NULL DEFAULT 'mercadopago',
	`provider_payment_id` varchar(255),
	`method` enum('pix','credit_card','debit_card') NOT NULL,
	`status` enum('pending','paid','failed','refunded','in_process','cancelled') NOT NULL DEFAULT 'pending',
	`amount` decimal(10,2) NOT NULL,
	`pix_qr_code` text,
	`pix_qr_code_text` text,
	`pix_expiration` timestamp,
	`card_last_four` varchar(4),
	`card_brand` varchar(20),
	`paid_at` timestamp,
	`failed_at` timestamp,
	`refunded_at` timestamp,
	`webhook_payload` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_order_id_unique` UNIQUE(`order_id`),
	CONSTRAINT `payments_order_id_idx` UNIQUE(`order_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` enum('admin_master','admin','operador') NOT NULL DEFAULT 'operador',
	`is_active` tinyint NOT NULL DEFAULT 1,
	`last_login_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255),
	`name` varchar(255) NOT NULL,
	`phone` varchar(20),
	`email_verified` tinyint NOT NULL DEFAULT 0,
	`is_active` tinyint NOT NULL DEFAULT 1,
	`google_id` varchar(255),
	`avatar_url` varchar(500),
	`accepted_terms_at` timestamp,
	`marketing_opt_in` tinyint NOT NULL DEFAULT 0,
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_email_unique` UNIQUE(`email`),
	CONSTRAINT `customers_email_idx` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `customer_addresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int NOT NULL,
	`label` varchar(50) DEFAULT 'Casa',
	`recipient_name` varchar(255) NOT NULL,
	`street` varchar(255) NOT NULL,
	`number` varchar(20) NOT NULL,
	`complement` varchar(100),
	`neighborhood` varchar(100) NOT NULL,
	`city` varchar(100) NOT NULL,
	`state` varchar(2) NOT NULL,
	`zip_code` varchar(9) NOT NULL,
	`is_default` tinyint NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_addresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`image_url` varchar(500),
	`display_order` int NOT NULL DEFAULT 0,
	`is_active` tinyint NOT NULL DEFAULT 1,
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `categories_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`url` varchar(500) NOT NULL,
	`alt_text` varchar(255),
	`display_order` int NOT NULL DEFAULT 0,
	`is_primary` tinyint NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`ingredients` text,
	`weight_grams` int,
	`price` decimal(10,2) NOT NULL,
	`compare_price` decimal(10,2),
	`is_active` tinyint NOT NULL DEFAULT 1,
	`is_featured` tinyint NOT NULL DEFAULT 0,
	`status` enum('published','draft','archived') NOT NULL DEFAULT 'draft',
	`deleted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `products_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `stock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 0,
	`min_quantity_alert` int NOT NULL DEFAULT 3,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stock_id` PRIMARY KEY(`id`),
	CONSTRAINT `stock_product_id_unique` UNIQUE(`product_id`),
	CONSTRAINT `stock_product_id_idx` UNIQUE(`product_id`)
);
--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`type` enum('entrada','saida','ajuste') NOT NULL,
	`quantity` int NOT NULL,
	`reason` varchar(255) NOT NULL,
	`user_id` int,
	`order_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` varchar(255),
	`type` enum('percentual','fixo') NOT NULL,
	`value` decimal(10,2) NOT NULL,
	`min_order_amount` decimal(10,2),
	`max_discount_amount` decimal(10,2),
	`max_uses` int,
	`current_uses` int NOT NULL DEFAULT 0,
	`max_uses_per_customer` int NOT NULL DEFAULT 1,
	`applies_to` enum('todos','categoria','produto') NOT NULL DEFAULT 'todos',
	`applies_to_id` int,
	`is_active` tinyint NOT NULL DEFAULT 1,
	`valid_from` timestamp,
	`valid_until` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_unique` UNIQUE(`code`),
	CONSTRAINT `coupons_code_idx` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `coupon_uses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupon_id` int NOT NULL,
	`customer_id` int,
	`order_id` int NOT NULL,
	`discount_amount` decimal(10,2) NOT NULL,
	`used_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coupon_uses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_status_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`status` enum('pending_payment','payment_failed','paid','in_production','ready','out_for_delivery','delivered','cancelled') NOT NULL,
	`note` varchar(500),
	`user_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_status_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`product_id` int,
	`product_name` varchar(255) NOT NULL,
	`product_price` decimal(10,2) NOT NULL,
	`product_slug` varchar(255),
	`quantity` int NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int,
	`order_number` varchar(30) NOT NULL,
	`status` enum('pending_payment','payment_failed','paid','in_production','ready','out_for_delivery','delivered','cancelled') NOT NULL DEFAULT 'pending_payment',
	`subtotal` decimal(10,2) NOT NULL,
	`discount_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`shipping_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`total` decimal(10,2) NOT NULL,
	`coupon_id` int,
	`payment_method` enum('pix','credit_card','debit_card'),
	`payment_status` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
	`notes` text,
	`delivery_name` varchar(255),
	`delivery_street` varchar(255),
	`delivery_number` varchar(20),
	`delivery_complement` varchar(100),
	`delivery_neighborhood` varchar(100),
	`delivery_city` varchar(100),
	`delivery_state` varchar(2),
	`delivery_zip` varchar(9),
	`delivery_date` date,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_order_number_unique` UNIQUE(`order_number`),
	CONSTRAINT `orders_order_number_idx` UNIQUE(`order_number`)
);
--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`event_type` enum('page_view','visualizacao_produto','busca','filtro_categoria','adicionar_carrinho','remover_carrinho','inicio_checkout','etapa_checkout','cupom_aplicado','pagamento_iniciado','compra','login','cadastro','clique_whatsapp','formulario_contato') NOT NULL,
	`payload` json,
	`page_url` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analytics_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` varchar(36) NOT NULL,
	`customer_id` int,
	`device_type` enum('mobile','tablet','desktop'),
	`browser` varchar(50),
	`os` varchar(50),
	`utm_source` varchar(100),
	`utm_medium` varchar(100),
	`utm_campaign` varchar(100),
	`referrer` varchar(500),
	`landing_page` varchar(500),
	`ip_hash` varchar(64),
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`last_seen_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `analytics_sessions_session_id_unique` UNIQUE(`session_id`)
);
--> statement-breakpoint
CREATE TABLE `analytics_page_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`product_id` int,
	`page_url` varchar(500) NOT NULL,
	`duration_seconds` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_page_views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `banners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`image_url` varchar(500) NOT NULL,
	`link_url` varchar(500),
	`display_order` int NOT NULL DEFAULT 0,
	`is_active` tinyint NOT NULL DEFAULT 1,
	`valid_from` timestamp,
	`valid_until` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `banners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `store_settings` (
	`id` int NOT NULL DEFAULT 1,
	`store_name` varchar(255) NOT NULL DEFAULT 'Felipe''s Bakery',
	`store_phone` varchar(20),
	`store_whatsapp` varchar(20) DEFAULT '5516997684430',
	`store_email` varchar(255),
	`store_address` varchar(500),
	`order_cutoff_day` int NOT NULL DEFAULT 3,
	`order_cutoff_hour` int NOT NULL DEFAULT 23,
	`delivery_day` int NOT NULL DEFAULT 5,
	`shipping_fee` varchar(20) DEFAULT '0.00',
	`free_shipping_above` varchar(20),
	`maintenance_mode` tinyint NOT NULL DEFAULT 0,
	`maintenance_message` varchar(500),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `store_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pages_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` json NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updated_by` int,
	CONSTRAINT `pages_content_id` PRIMARY KEY(`id`),
	CONSTRAINT `pages_content_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `pages_content_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`action` varchar(100) NOT NULL,
	`entity_type` varchar(50) NOT NULL,
	`entity_id` int,
	`old_value` json,
	`new_value` json,
	`ip_address` varchar(45),
	`user_agent` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(20),
	`message` text NOT NULL,
	`status` enum('nova','lida','respondida') NOT NULL DEFAULT 'nova',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_addresses` ADD CONSTRAINT `customer_addresses_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock` ADD CONSTRAINT `stock_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coupon_uses` ADD CONSTRAINT `coupon_uses_coupon_id_coupons_id_fk` FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coupon_uses` ADD CONSTRAINT `coupon_uses_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `coupon_uses` ADD CONSTRAINT `coupon_uses_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_status_history` ADD CONSTRAINT `order_status_history_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_status_history` ADD CONSTRAINT `order_status_history_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analytics_events` ADD CONSTRAINT `analytics_events_session_id_analytics_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `analytics_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analytics_sessions` ADD CONSTRAINT `analytics_sessions_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analytics_page_views` ADD CONSTRAINT `analytics_page_views_session_id_analytics_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `analytics_sessions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analytics_page_views` ADD CONSTRAINT `analytics_page_views_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pages_content` ADD CONSTRAINT `pages_content_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `payments_provider_id_idx` ON `payments` (`provider_payment_id`);--> statement-breakpoint
CREATE INDEX `payments_status_idx` ON `payments` (`status`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `users_is_active_idx` ON `users` (`is_active`);--> statement-breakpoint
CREATE INDEX `customers_google_id_idx` ON `customers` (`google_id`);--> statement-breakpoint
CREATE INDEX `customers_is_active_idx` ON `customers` (`is_active`);--> statement-breakpoint
CREATE INDEX `customers_deleted_at_idx` ON `customers` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `customer_addresses_default_idx` ON `customer_addresses` (`customer_id`,`is_default`);--> statement-breakpoint
CREATE INDEX `categories_is_active_idx` ON `categories` (`is_active`);--> statement-breakpoint
CREATE INDEX `categories_display_order_idx` ON `categories` (`display_order`);--> statement-breakpoint
CREATE INDEX `categories_deleted_at_idx` ON `categories` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `product_images_product_id_idx` ON `product_images` (`product_id`);--> statement-breakpoint
CREATE INDEX `product_images_order_idx` ON `product_images` (`product_id`,`display_order`);--> statement-breakpoint
CREATE INDEX `products_catalog_idx` ON `products` (`category_id`,`is_active`,`status`);--> statement-breakpoint
CREATE INDEX `products_featured_idx` ON `products` (`is_featured`,`is_active`);--> statement-breakpoint
CREATE INDEX `products_deleted_at_idx` ON `products` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `products_price_idx` ON `products` (`price`);--> statement-breakpoint
CREATE INDEX `stock_quantity_idx` ON `stock` (`quantity`);--> statement-breakpoint
CREATE INDEX `stock_movements_product_id_idx` ON `stock_movements` (`product_id`);--> statement-breakpoint
CREATE INDEX `stock_movements_type_idx` ON `stock_movements` (`type`);--> statement-breakpoint
CREATE INDEX `stock_movements_created_at_idx` ON `stock_movements` (`created_at`);--> statement-breakpoint
CREATE INDEX `stock_movements_user_id_idx` ON `stock_movements` (`user_id`);--> statement-breakpoint
CREATE INDEX `stock_movements_order_id_idx` ON `stock_movements` (`order_id`);--> statement-breakpoint
CREATE INDEX `coupons_is_active_idx` ON `coupons` (`is_active`);--> statement-breakpoint
CREATE INDEX `coupons_validity_idx` ON `coupons` (`is_active`,`valid_from`,`valid_until`);--> statement-breakpoint
CREATE INDEX `coupon_uses_coupon_customer_idx` ON `coupon_uses` (`coupon_id`,`customer_id`);--> statement-breakpoint
CREATE INDEX `coupon_uses_coupon_id_idx` ON `coupon_uses` (`coupon_id`);--> statement-breakpoint
CREATE INDEX `coupon_uses_order_id_idx` ON `coupon_uses` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_status_history_order_id_idx` ON `order_status_history` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_status_history_created_at_idx` ON `order_status_history` (`created_at`);--> statement-breakpoint
CREATE INDEX `order_items_order_id_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_items_product_id_idx` ON `order_items` (`product_id`);--> statement-breakpoint
CREATE INDEX `orders_customer_date_idx` ON `orders` (`customer_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `orders_status_date_idx` ON `orders` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `orders_payment_status_idx` ON `orders` (`payment_status`);--> statement-breakpoint
CREATE INDEX `orders_created_at_idx` ON `orders` (`created_at`);--> statement-breakpoint
CREATE INDEX `orders_delivery_date_idx` ON `orders` (`delivery_date`);--> statement-breakpoint
CREATE INDEX `analytics_events_session_type_idx` ON `analytics_events` (`session_id`,`event_type`);--> statement-breakpoint
CREATE INDEX `analytics_events_type_idx` ON `analytics_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `analytics_events_created_at_idx` ON `analytics_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `analytics_sessions_sid_idx` ON `analytics_sessions` (`session_id`);--> statement-breakpoint
CREATE INDEX `analytics_sessions_customer_idx` ON `analytics_sessions` (`customer_id`);--> statement-breakpoint
CREATE INDEX `analytics_sessions_started_idx` ON `analytics_sessions` (`started_at`);--> statement-breakpoint
CREATE INDEX `analytics_sessions_device_idx` ON `analytics_sessions` (`device_type`);--> statement-breakpoint
CREATE INDEX `analytics_pv_product_date_idx` ON `analytics_page_views` (`product_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `analytics_pv_session_idx` ON `analytics_page_views` (`session_id`);--> statement-breakpoint
CREATE INDEX `analytics_pv_created_at_idx` ON `analytics_page_views` (`created_at`);--> statement-breakpoint
CREATE INDEX `banners_is_active_idx` ON `banners` (`is_active`);--> statement-breakpoint
CREATE INDEX `banners_display_order_idx` ON `banners` (`display_order`);--> statement-breakpoint
CREATE INDEX `banners_validity_idx` ON `banners` (`is_active`,`valid_from`,`valid_until`);--> statement-breakpoint
CREATE INDEX `audit_logs_user_date_idx` ON `audit_logs` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_action_idx` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `audit_logs_entity_idx` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_created_at_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `contact_messages_status_idx` ON `contact_messages` (`status`);--> statement-breakpoint
CREATE INDEX `contact_messages_created_at_idx` ON `contact_messages` (`created_at`);