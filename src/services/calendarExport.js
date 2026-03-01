import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';

const APP_CALENDAR_TITLE = 'Anchored Pickup Days';
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function stripZoneLabels(value) {
  return value
    .split('•')
    .map((part) => part.trim())
    .filter((part) => part && !part.toLowerCase().includes('zone'))
    .join(' • ');
}

function buildEventTitle(service) {
  const summary = stripZoneLabels(service.items || '');
  return summary ? `Anchored pickup: ${summary}` : 'Anchored pickup day';
}

function getAllDayRange(dateISO) {
  const startDate = new Date(`${dateISO}T00:00:00`);
  const endDate = new Date(startDate.getTime() + DAY_IN_MS);
  return { startDate, endDate };
}

async function getCalendarSource() {
  if (Platform.OS === 'ios') {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    return defaultCalendar.source;
  }

  return { isLocalAccount: true, name: APP_CALENDAR_TITLE };
}

async function ensureAnchoredCalendarAsync() {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const existingCalendar = calendars.find((calendar) => calendar.title === APP_CALENDAR_TITLE);

  if (existingCalendar) {
    return existingCalendar.id;
  }

  const source = await getCalendarSource();

  return Calendar.createCalendarAsync({
    title: APP_CALENDAR_TITLE,
    color: '#004B8D',
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: source.id,
    source,
    name: APP_CALENDAR_TITLE,
    ownerAccount: 'personal',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

export async function exportPickupScheduleToCalendar({ address, services }) {
  if (!services?.length) {
    throw new Error('No pickup dates are available to export yet.');
  }

  const isAvailable = await Calendar.isAvailableAsync();

  if (!isAvailable) {
    throw new Error('Calendar access is not available on this device.');
  }

  const permission = await Calendar.requestCalendarPermissionsAsync();

  if (permission.status !== 'granted') {
    throw new Error('Calendar permission is required to export pickup days.');
  }

  const datedServices = services.filter((service) => service.dateISO);

  if (!datedServices.length) {
    throw new Error('No pickup dates are available to export yet.');
  }

  const calendarId = await ensureAnchoredCalendarAsync();
  const firstDate = new Date(`${datedServices[0].dateISO}T00:00:00`);
  const lastDate = new Date(`${datedServices[datedServices.length - 1].dateISO}T00:00:00`);
  const existingEvents = await Calendar.getEventsAsync(
    [calendarId],
    firstDate,
    new Date(lastDate.getTime() + DAY_IN_MS * 2)
  );
  const existingEventKeys = new Set(
    existingEvents.map((event) => {
      const date = new Date(event.startDate).toISOString().slice(0, 10);
      return `${event.title}|${date}`;
    })
  );

  let createdCount = 0;
  let skippedCount = 0;

  for (const service of datedServices) {
    const title = buildEventTitle(service);
    const eventKey = `${title}|${service.dateISO}`;

    if (existingEventKeys.has(eventKey)) {
      skippedCount += 1;
      continue;
    }

    const { startDate, endDate } = getAllDayRange(service.dateISO);

    await Calendar.createEventAsync(calendarId, {
      title,
      startDate,
      endDate,
      allDay: true,
      location: address,
      notes: 'Municipal pickup schedule exported from Anchored.',
    });

    createdCount += 1;
  }

  return {
    createdCount,
    skippedCount,
    calendarTitle: APP_CALENDAR_TITLE,
  };
}
