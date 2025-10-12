import type { Notification, NotificationBig } from '$lib/types';
import { writable } from 'svelte/store';

export const notifications = writable<Notification[]>([]);

export const addNotification = (notification: Notification) => {
	notifications.update((state) => [...state, notification]);
};

export const removeNotification = (notification: Notification) => {
	notifications.update((state) => state.filter((n) => n.id !== notification.id));
};

export const notificationsBig = writable<Notification[]>([]);

export const addNotificationBig = (notification: NotificationBig) => {
	notificationsBig.update((state) => [...state, notification]);
};

export const removeNotificationBig = (notification: NotificationBig) => {
	notificationsBig.update((state) => state.filter((n) => n.id !== notification.id));
};
