PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_group_member` (
	`group_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	PRIMARY KEY(`group_id`, `user_id`),
	FOREIGN KEY (`group_id`) REFERENCES `group`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_group_member`("group_id", "user_id") SELECT "group_id", "user_id" FROM `group_member`;--> statement-breakpoint
DROP TABLE `group_member`;--> statement-breakpoint
ALTER TABLE `__new_group_member` RENAME TO `group_member`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint