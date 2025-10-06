export type User = {
	id: number;
	name: string;
	email?: string;
};

export type Task = {
	id: number;
	title: string;
	emoji: string | null;
	scheduledAt: number | null;
	assignedUserId: number | null;
	durationMinutes?: number | null;
	recurrenceType?: string | null;
	recurrenceInterval?: number | null;
};

export type Treat = {
	id: number;
	fromUserId: number;
	toUserId: number;
	accepted: boolean;
	valueMinutes: number;
};
