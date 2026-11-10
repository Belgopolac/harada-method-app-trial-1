package com.harada.method;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.CalendarContract;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import java.util.Calendar;
import java.util.TimeZone;

public class CalendarModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public CalendarModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() { return "CalendarModule"; }

    private boolean hasCalendarPermissions() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
        return reactContext.checkSelfPermission(Manifest.permission.READ_CALENDAR) == PackageManager.PERMISSION_GRANTED
            && reactContext.checkSelfPermission(Manifest.permission.WRITE_CALENDAR) == PackageManager.PERMISSION_GRANTED;
    }

    @ReactMethod
    public void checkPermissions(Promise promise) {
        promise.resolve(hasCalendarPermissions());
    }

    @ReactMethod
    public void addEvent(String title, double startDate, double endDate, String description, Promise promise) {
        if (!hasCalendarPermissions()) { promise.reject("PERMISSION_DENIED", "Calendar permissions are required"); return; }
        try {
            ContentResolver resolver = reactContext.getContentResolver();
            long calendarId = getDefaultCalendarId();
            if (calendarId < 0) { promise.reject("NO_CALENDAR", "No writable primary calendar was found"); return; }
            ContentValues values = new ContentValues();
            values.put(CalendarContract.Events.TITLE, title);
            values.put(CalendarContract.Events.DESCRIPTION, description);
            values.put(CalendarContract.Events.CALENDAR_ID, calendarId);
            values.put(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().getID());
            values.put(CalendarContract.Events.DTSTART, (long) startDate);
            values.put(CalendarContract.Events.DTEND, (long) endDate);
            Uri uri = resolver.insert(CalendarContract.Events.CONTENT_URI, values);
            if (uri == null || uri.getLastPathSegment() == null) { promise.reject("ADD_ERROR", "Calendar provider did not return an event id"); return; }
            promise.resolve(uri.getLastPathSegment());
        } catch (Exception e) {
            promise.reject("ADD_ERROR", "Failed to add event", e);
        }
    }

    @ReactMethod
    public void updateEvent(String eventId, String title, double startDate, double endDate, String description, Promise promise) {
        if (!hasCalendarPermissions()) { promise.reject("PERMISSION_DENIED", "Calendar permissions are required"); return; }
        try {
            ContentValues values = new ContentValues();
            values.put(CalendarContract.Events.TITLE, title);
            values.put(CalendarContract.Events.DESCRIPTION, description);
            values.put(CalendarContract.Events.DTSTART, (long) startDate);
            values.put(CalendarContract.Events.DTEND, (long) endDate);
            values.put(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().getID());
            int updated = reactContext.getContentResolver().update(
                CalendarContract.Events.CONTENT_URI, values,
                CalendarContract.Events._ID + "=?", new String[] { eventId }
            );
            promise.resolve(updated > 0);
        } catch (Exception e) {
            promise.reject("UPDATE_ERROR", "Failed to update event", e);
        }
    }

    @ReactMethod
    public void deleteEvent(String eventId, Promise promise) {
        if (!hasCalendarPermissions()) { promise.reject("PERMISSION_DENIED", "Calendar permissions are required"); return; }
        try {
            int deleted = reactContext.getContentResolver().delete(
                CalendarContract.Events.CONTENT_URI,
                CalendarContract.Events._ID + "=?", new String[] { eventId }
            );
            promise.resolve(deleted > 0);
        } catch (Exception e) {
            promise.reject("DELETE_ERROR", "Failed to delete event", e);
        }
    }

    @ReactMethod
    public void getEventsForDate(double date, Promise promise) {
        if (!hasCalendarPermissions()) { promise.reject("PERMISSION_DENIED", "Calendar permissions are required"); return; }
        try {
            Calendar start = Calendar.getInstance();
            start.setTimeInMillis((long) date);
            start.set(Calendar.HOUR_OF_DAY, 0); start.set(Calendar.MINUTE, 0); start.set(Calendar.SECOND, 0); start.set(Calendar.MILLISECOND, 0);
            Calendar end = (Calendar) start.clone();
            end.add(Calendar.DAY_OF_MONTH, 1);
            long calendarId = getDefaultCalendarId();
            if (calendarId < 0) { promise.resolve(Arguments.createArray()); return; }
            String selection = CalendarContract.Events.CALENDAR_ID + "=? AND " + CalendarContract.Events.DTSTART + ">=? AND " + CalendarContract.Events.DTSTART + "<?";
            String[] args = { String.valueOf(calendarId), String.valueOf(start.getTimeInMillis()), String.valueOf(end.getTimeInMillis()) };
            Cursor cursor = reactContext.getContentResolver().query(
                CalendarContract.Events.CONTENT_URI,
                new String[] { CalendarContract.Events._ID, CalendarContract.Events.TITLE, CalendarContract.Events.DESCRIPTION, CalendarContract.Events.DTSTART, CalendarContract.Events.DTEND },
                selection, args, CalendarContract.Events.DTSTART + " ASC"
            );
            WritableArray result = Arguments.createArray();
            if (cursor != null) {
                try {
                    while (cursor.moveToNext()) {
                        WritableMap event = Arguments.createMap();
                        event.putString("id", cursor.getString(0));
                        event.putString("title", cursor.getString(1));
                        if (cursor.isNull(2)) event.putNull("description"); else event.putString("description", cursor.getString(2));
                        event.putDouble("startDate", cursor.getLong(3));
                        event.putDouble("endDate", cursor.getLong(4));
                        event.putBoolean("isHaradaEvent", cursor.getString(2) != null && cursor.getString(2).contains("Harada Method"));
                        result.pushMap(event);
                    }
                } finally { cursor.close(); }
            }
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("QUERY_ERROR", "Failed to query events", e);
        }
    }

    private long getDefaultCalendarId() {
        Cursor cursor = reactContext.getContentResolver().query(
            CalendarContract.Calendars.CONTENT_URI,
            new String[] { CalendarContract.Calendars._ID },
            CalendarContract.Calendars.IS_PRIMARY + "=1 AND " + CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL + ">=?",
            new String[] { String.valueOf(CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR) },
            null
        );
        if (cursor != null) {
            try { if (cursor.moveToFirst()) return cursor.getLong(0); }
            finally { cursor.close(); }
        }
        return -1;
    }
}
