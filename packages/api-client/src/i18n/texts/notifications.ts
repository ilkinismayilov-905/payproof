import { defineTexts } from "../dict";

/** Topbar notification bell. */
export const notificationsText = defineTexts({
  az: {
    unreadCount: (label: string, n: number) => `${label}, ${n} oxunmamış`,
    markAllRead: "Hamısını oxunmuş et",
    emptyTitle: "Bildiriş yoxdur",
    emptyBody: "Yeni hadisə olduqda burada görünəcək.",
    unread: "Oxunmamış: ",
  },
  en: {
    unreadCount: (label, n) => `${label}, ${n} unread`,
    markAllRead: "Mark all as read",
    emptyTitle: "No notifications",
    emptyBody: "New events will appear here.",
    unread: "Unread: ",
  },
});
