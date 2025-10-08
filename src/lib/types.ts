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
	completedAt?: number | null;
	recurrenceType?: string | null;
	recurrenceInterval?: number | null;
};

export type Treat = {
	id: number;
	title: string;
	emoji: string | null;
	fromUserId: number;
	toUserId: number;
	accepted: boolean;
	valueMinutes: number;
    createdAt: number;
    acceptedAt?: number | null;
    declinedAt?: number | null;
    feedbackNote?: string | null;
};
