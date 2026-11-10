import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { DailyForecast, GeocodingResult, getWeather, getWeatherDescription, getWeather as fetchWeather, searchLocation, WeatherReport } from '../services/weather';

const DEFAULT_CITY = 'London';

const formatDay = (isoDate: string): string => {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString(undefined, { weekday: 'short' });
};

const formatClockTime = (isoDateTime: string): string => {
  const date = new Date(isoDateTime);
  return Number.isNaN(date.getTime()) ? '--:--' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const locationTitle = (location: GeocodingResult): string => [location.name, location.admin1, location.country].filter(Boolean).join(', ');

const WeatherScreen = () => {
  const [query, setQuery] = useState(DEFAULT_CITY);
  const [report, setReport] = useState<WeatherReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadForLocation = useCallback(async (location: GeocodingResult) => {
    setLoading(true);
    setError(null);
    try {
      const weather = await fetchWeather(location);
      setReport(weather);
      setQuery(location.name);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load weather right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const location = await searchLocation(query);
      const weather = await getWeather(location);
      setReport(weather);
      setQuery(location.name);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load weather right now.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void search();
  }, []);

  const refresh = () => {
    if (report) void loadForLocation(report.location);
    else void search();
  };

  const current = report?.current;
  const conditions = current ? getWeatherDescription(current.weatherCode) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headingRow}>
          <View><Text style={styles.title}>Weather</Text><Text style={styles.subtitle}>Current conditions and 5-day outlook</Text></View>
          <TouchableOpacity accessibilityRole="button" onPress={refresh} style={styles.refreshButton}><Text style={styles.refreshText}>↻</Text></TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            accessibilityLabel="Search city"
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Enter a city"
            placeholderTextColor="#8A96AA"
            returnKeyType="search"
            onSubmitEditing={() => void search()}
            autoCapitalize="words"
          />
          <TouchableOpacity accessibilityRole="button" style={styles.searchButton} onPress={() => void search()} disabled={loading}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {loading && !report && <View style={styles.loading}><ActivityIndicator size="large" color="#FFFFFF" /><Text style={styles.loadingText}>Getting the forecast…</Text></View>}
        {!!error && <View style={styles.errorCard}><Text style={styles.errorTitle}>Weather unavailable</Text><Text style={styles.errorText}>{error}</Text><TouchableOpacity onPress={refresh}><Text style={styles.retryText}>Try again</Text></TouchableOpacity></View>}

        {report && current && conditions && <>
          <View style={styles.currentCard}>
            <Text style={styles.location}>{locationTitle(report.location)}</Text>
            <Text style={styles.localLabel}>Local conditions</Text>
            <View style={styles.currentMain}>
              <Text style={styles.weatherIcon}>{conditions.icon}</Text>
              <View><Text style={styles.temperature}>{Math.round(current.temperature)}°</Text><Text style={styles.condition}>{conditions.label}</Text></View>
            </View>
            <Text style={styles.feelsLike}>Feels like {Math.round(current.apparentTemperature)}°</Text>
            <View style={styles.metricsRow}>
              <Metric label="Humidity" value={`${Math.round(current.humidity)}%`} icon="💧" />
              <Metric label="Wind" value={`${Math.round(current.windSpeed)} km/h`} icon="🌬️" />
              <Metric label="Rain" value={`${current.precipitation.toFixed(1)} mm`} icon="☔" />
            </View>
          </View>

          <View style={styles.forecastCard}>
            <Text style={styles.sectionTitle}>5-day forecast</Text>
            {report.forecast.map((day: DailyForecast, index) => {
              const dayWeather = getWeatherDescription(day.weatherCode);
              return <View key={day.date} style={[styles.forecastRow, index === report.forecast.length - 1 && styles.lastForecastRow]}>
                <Text style={styles.dayName}>{index === 0 ? 'Today' : formatDay(day.date)}</Text>
                <Text style={styles.forecastIcon}>{dayWeather.icon}</Text>
                <Text style={styles.forecastCondition}>{dayWeather.label}</Text>
                <Text style={styles.temperatureRange}>{Math.round(day.temperatureMax)}° <Text style={styles.lowTemperature}>{Math.round(day.temperatureMin)}°</Text></Text>
              </View>;
            })}
          </View>

          <View style={styles.sunCard}>
            <Text style={styles.sectionTitle}>Sunrise & sunset</Text>
            <View style={styles.sunRow}><Text style={styles.sunItem}>🌅 Sunrise  {formatClockTime(report.forecast[0]?.sunrise ?? '')}</Text><Text style={styles.sunItem}>🌇 Sunset  {formatClockTime(report.forecast[0]?.sunset ?? '')}</Text></View>
          </View>
          <Text style={styles.attribution}>Weather data by Open-Meteo</Text>
        </>}
      </ScrollView>
    </SafeAreaView>
  );
};

const Metric = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
  <View style={styles.metric}><Text style={styles.metricIcon}>{icon}</Text><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#142C50' },
  content: { flexGrow: 1, padding: 20, paddingBottom: 36, backgroundColor: '#142C50' },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '700' },
  subtitle: { color: '#C4D3E8', fontSize: 13, marginTop: 4 },
  refreshButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#28466F', justifyContent: 'center', alignItems: 'center' },
  refreshText: { color: '#FFFFFF', fontSize: 28 },
  searchRow: { flexDirection: 'row', marginBottom: 18 },
  searchInput: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, color: '#172B4D', marginRight: 10 },
  searchButton: { backgroundColor: '#F3B94F', borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' },
  searchButtonText: { color: '#172B4D', fontWeight: '700' },
  loading: { padding: 35, alignItems: 'center' }, loadingText: { color: '#FFFFFF', marginTop: 12 },
  errorCard: { backgroundColor: '#FFF1F0', borderRadius: 14, padding: 18, marginBottom: 16 }, errorTitle: { color: '#A61B1B', fontWeight: '700', fontSize: 16 }, errorText: { color: '#5D3434', marginTop: 6, lineHeight: 20 }, retryText: { color: '#6B46C1', fontWeight: '700', marginTop: 12 },
  currentCard: { backgroundColor: '#28466F', borderRadius: 22, padding: 22, marginBottom: 16 },
  location: { color: '#FFFFFF', fontSize: 21, fontWeight: '700' }, localLabel: { color: '#C4D3E8', fontSize: 13, marginTop: 3 },
  currentMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 8 }, weatherIcon: { fontSize: 72, marginRight: 18 }, temperature: { color: '#FFFFFF', fontSize: 64, fontWeight: '300' }, condition: { color: '#E4ECF6', fontSize: 17 }, feelsLike: { color: '#C4D3E8', textAlign: 'center', marginBottom: 22 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#456182', paddingTop: 16 }, metric: { alignItems: 'center', flex: 1 }, metricIcon: { fontSize: 18, marginBottom: 5 }, metricValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' }, metricLabel: { color: '#C4D3E8', fontSize: 11, marginTop: 3 },
  forecastCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginBottom: 16 }, sectionTitle: { color: '#1C2D45', fontSize: 17, fontWeight: '700', marginBottom: 12 }, forecastRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#DCE3EC' }, lastForecastRow: { borderBottomWidth: 0 }, dayName: { width: 52, color: '#253B58', fontSize: 13, fontWeight: '600' }, forecastIcon: { width: 34, fontSize: 21 }, forecastCondition: { flex: 1, color: '#596A80', fontSize: 12 }, temperatureRange: { color: '#263A55', fontSize: 14, fontWeight: '700' }, lowTemperature: { color: '#8290A2', fontWeight: '400' },
  sunCard: { backgroundColor: '#28466F', borderRadius: 18, padding: 18 }, sunCardTitle: { color: '#FFFFFF' }, sunRow: { flexDirection: 'row', justifyContent: 'space-between' }, sunItem: { color: '#F4F7FB', fontSize: 13 }, attribution: { color: '#AEBED2', fontSize: 11, textAlign: 'center', marginTop: 18 },
});

export default WeatherScreen;
