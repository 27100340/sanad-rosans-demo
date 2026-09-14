import { relativeStamp } from "@/components/leadership/format";
import type { NotificationRow } from "@/components/portal/notification-list";
import { personName, type Notification } from "@/lib/data/mock/notify";

/** Server-side shaping: names and dates are resolved here so the client list carries no mock data. */
export function toNotificationRow(n: Notification): NotificationRow {
  return {
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body,
    href: n.href,
    when: relativeStamp(n.at),
    read: Boolean(n.readAt),
    fromName: n.fromId ? personName(n.fromId) : undefined,
  };
}
