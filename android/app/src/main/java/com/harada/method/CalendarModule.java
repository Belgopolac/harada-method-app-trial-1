package com.harada.method;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.database.Cursor;
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
    private static final String TAG = "CalendarModule";
    private final ReactApplicationContext reactContext;

    public CalendarModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "CalendarModule";
    }

    @ReactMethod
    public void checkPermissions(Promise promise) {
        try {
            ContentResolver cr = reactContext.getContentResolver();
            String[] projection = new String[] { CalendarContract.Calendars._ID };
            Cursor cursor = cr.query(
                CalendarContract.Calendars.CONTENT_URI,
                projection,
                null,
                null,
                null
            );
            boolean hasPermission = cursor != null && cursor.getCount() > 0;
            if (cursor != null) {
                cursor.close();
            }
            promise.resolve(hasPermission);
        } catch (Exception e) {
            promise.reject("PERMISSION_ERROR", "Failed to check permissions", e);
        }
    }

    @ReactMethod
    public void requestPermissions(Promise promise) {
        checkPermissions(promise);
    }

    @ReactMethod
    public void addEvent(
        String title,
        double startDate,
        double endDate,
        String description,
        Promise promise
    ) {
        try {
            ContentResolver cr = reactContext.getContentResolver();
            long calId = getDefaultCalendarId();

            if (calId == -1) {
                promise.reject("NO_CALENDAR", "No calendar found");
                return;
            }

            ContentValues values = new ContentValues();
            values.put(CalendarContract.Events.TITLE, title);
            values.put(CalendarContract.Events.DESCRIPTION, description);
            values.put(CalendarContract.Events.CALENDAR_ID, calId);
            values.put(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().getID());
            values.put(CalendarContract.Events.DTSTART, (long) startDate);
            values.put(CalendarContract.Events.DTEND, (long) endDate);
            values.put(CalendarContract.Events.HAS_ALARM, 1);

            java.util.Calendar startCal = java.util.Calendar.getInstance();
            startCal.setTimeInMillis((long) startDate);
            values.put(CalendarContract.Events.DTSTART, startCal.getTimeInMillis());

            java.util.Calendar endCal = java.util.Calendar.getInstance();
            endCal.setTimeInMillis((long) endDate);
            values.put(CalendarContract.Events.DTEND, endCal.getTimeInMillis());

            cr.insert(CalendarContract.Events.CONTENT_URI, values);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ADD_ERROR", "Failed to add event", e);
        }
    }

    @ReactMethod
    public void updateEvent(
        String eventId,
        String title,
        double startDate,
        double endDate,
        String description,
        Promise promise
    ) {
        try {
            ContentResolver cr = reactContext.getContentResolver();

            ContentValues values = new ContentValues();
            values.put(CalendarContract.Events.TITLE, title);
            values.put(CalendarContract.Events.DESCRIPTION, description);
            values.put(CalendarContract.Events.DTSTART, (long) startDate);
            values.put(CalendarContract.Events.DTEND, (long) endDate);

            java.util.Calendar startCal = java.util.Calendar.getInstance();
            startCal.setTimeInMillis((long) startDate);
            values.put(CalendarContract.Events.DTSTART, startCal.getTimeInMillis());

            java.util.Calendar endCal = java.util.Calendar.getInstance();
            endCal.setTimeInMillis((long) endDate);
            values.put(CalendarContract.Events.DTEND, endCal.getTimeInMillis());

            int updated = cr.update(
                CalendarContract.Events.CONTENT_URI,
                values,
                CalendarContract.Events._ID + "=?",
                new String[] { eventId }
            );

            promise.resolve(updated > 0);
        } catch (Exception e) {
            promise.reject("UPDATE_ERROR", "Failed to update event", e);
        }
    }

    @ReactMethod
    public void deleteEvent(String eventId, Promise promise) {
        try {
            ContentResolver cr = reactContext.getContentResolver();
            int deleted = cr.delete(
                CalendarContract.Events.CONTENT_URI,
                CalendarContract.Events._ID + "=?",
                new String[] { eventId }
            );
            promise.resolve(deleted > 0);
        } catch (Exception e) {
            promise.reject("DELETE_ERROR", "Failed to delete event", e);
        }
    }

    @ReactMethod
    public void getEventsForDate(double date, Promise promise) {
        try {
            ContentResolver cr = reactContext.getContentResolver();
            long calId = getDefaultCalendarId();

            if (calId == -1) {
                promise.resolve(Arguments.createArray());
                return;
            }

            java.util.Calendar startCal = java.util.Calendar.getInstance();
            startCal.setTimeInMillis((long) date);
            startCal.set(Calendar.HOUR_OF_DAY, 0);
            startCal.set(Calendar.MINUTE, 0);
            startCal.set(Calendar.SECOND, 0);
            startCal.set(Calendar.MILLISECOND, 0);

            java.util.Calendar endCal = java.util.Calendar.getInstance();
            endCal.setTimeInMillis((long) date);
            endCal.set(Calendar.HOUR_OF_DAY, 23);
            endCal.set(Calendar.MINUTE, 59);
            endCal.set(Calendar.SECOND, 59);
            endCal.set(Calendar.MILLISECOND, 999);

            String selection = CalendarContract.Events.CALENDAR_ID + "=? AND " +
                CalendarContract.Events.DTSTART + ">=? AND " +
                CalendarContract.Events.DTSTART + "<=?";
            String[] selectionArgs = new String[] {
                String.valueOf(calId),
                String.valueOf(startCal.getTimeInMillis()),
                String.valueOf(endCal.getTimeInMillis())
            };

            Cursor cursor = cr.query(
                CalendarContract.Events.CONTENT_URI,
                new String[] {
                    CalendarContract.Events._ID,
                    CalendarContract.Events.TITLE,
                    CalendarContract.Events.DESCRIPTION,
                    CalendarContract.Events.DTSTART,
                    CalendarContract.Events.DTEND
                },
                selection,
                selectionArgs,
                CalendarContract.Events.DTSTART + " ASC"
            );

            WritableArray results = Arguments.createArray();

            if (cursor != null) {
                while (cursor.moveToNext()) {
                    WritableMap event = Arguments.createMap();
                    event.putString("id", cursor.getString(0));
                    event.putString("title", cursor.getString(1));
                    event.putString("description", cursor.getString(2));
                    event.putDouble("startDate", (double) cursor.getLong(3));
                    event.putDouble("endDate", (double) cursor.getLong(4));
                    event.putBoolean("isHaradaEvent",
                        cursor.getString(2) != null && cursor.getString(2).contains("Harada Method"));
                    results.pushMap(event);
                }
                cursor.close();
            }

            promise.resolve(results);
        } catch (Exception e) {
            promise.reject("QUERY_ERROR", "Failed to query events", e);
        }
    }

    private long getDefaultCalendarId() {
        ContentResolver cr = reactContext.getContentResolver();
        Cursor cursor = cr.query(
            CalendarContract.Calendars.CONTENT_URI,
            new String[] { CalendarContract.Calendars._ID },
            CalendarContract.Calendars.IS_PRIMARY + "=1",
            null,
            null
        );

        if (cursor != null && cursor.moveToFirst()) {
            long calId = cursor.getLong(0);
            cursor.close();
            return calId;
        }
        return -1;
    }
}
