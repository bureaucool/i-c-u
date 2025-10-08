import { sqliteTable, integer, text, primaryKey } from 'drizzle-orm/sqlite-core';

// Users have equal rights within a group; membership is handled via group_members table
export const user = sqliteTable('user', {
	id: integer('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	availableTimeMinutesPerWeek: integer('available_time_minutes_per_week').notNull().default(0),
	passwordHash: text('password_hash')
});

// Groups organize users, tasks, treats
export const group = sqliteTable('group', {
	id: integer('id').primaryKey(),
	title: text('title').notNull()
});

// Many-to-many membership: all members have same rights
export const groupMember = sqliteTable(
	'group_member',
	{
		groupId: integer('group_id')
			.notNull()
			.references(() => group.id, { onDelete: 'cascade' }),
		userId: integer('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' })
	},
	(t) => ({
		pk: primaryKey({ columns: [t.groupId, t.userId] })
	})
);

// Group invites by email
export const invite = sqliteTable('invite', {
	id: integer('id').primaryKey(),
	groupId: integer('group_id')
		.notNull()
		.references(() => group.id, { onDelete: 'cascade' }),
	email: text('email').notNull(),
	token: text('token').notNull().unique(),
	accepted: integer('accepted', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at').notNull()
});

// Task recurrence: type and optional interval (for every_x_*)
export type RecurrenceType =
	| 'none'
	| 'daily'
	| 'weekly'
	| 'monthly'
	| 'every_x_days'
	| 'every_x_weeks'
	| 'every_x_months';

export const task = sqliteTable('task', {
	id: integer('id').primaryKey(),
	groupId: integer('group_id')
		.notNull()
		.references(() => group.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	emoji: text('emoji'),
	assignedUserId: integer('assigned_user_id').references(() => user.id, { onDelete: 'set null' }),
	durationMinutes: integer('duration_minutes'), // set when the task is finished
	scheduledAt: integer('scheduled_at'),
	recurrenceType: text('recurrence_type'), // RecurrenceType string
	recurrenceInterval: integer('recurrence_interval'), // used for every_x_* variants
	completedAt: integer('completed_at')
});

// Treats can compensate task time between users
export const treat = sqliteTable('treat', {
	id: integer('id').primaryKey(),
	groupId: integer('group_id')
		.notNull()
		.references(() => group.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	emoji: text('emoji'),
	fromUserId: integer('from_user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	toUserId: integer('to_user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accepted: integer('accepted', { mode: 'boolean' }).notNull().default(false),
	valueMinutes: integer('value_minutes').notNull().default(0),
	createdAt: integer('created_at').notNull(),
	acceptedAt: integer('accepted_at'),
	declinedAt: integer('declined_at'),
	feedbackNote: text('feedback_note')
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at').notNull()
});
