import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Linking, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { valuate } from './api';
import { c } from './theme';

const zl = (n) => (n == null ? '—' : `${Math.round(n)} zł`);

export default function SellScreen() {
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function pick(useCamera) {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Brak zgody', 'Zezwól na dostęp w ustawieniach telefonu.');
      return;
    }
    const opts = { base64: true, quality: 0.5, allowsEditing: false };
    const res = useCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled) return;
    const a = res.assets[0];
    setPhoto(a.uri);
    setResult(null);
    setError(null);
    setLoading(true);
    try {
      setResult(await valuate(a.base64, a.mimeType || 'image/jpeg'));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      {!photo && (
        <Text style={s.lead}>Zrób zdjęcie przedmiotu. Zakupator rozpozna go i wyceni na podstawie aktualnych ofert.</Text>
      )}

      {photo && <Image source={{ uri: photo }} style={s.photo} />}

      <View style={s.row}>
        <TouchableOpacity style={[s.btn, s.btnMain]} onPress={() => pick(true)}>
          <Text style={s.btnMainText}>{photo ? 'Skanuj ponownie' : 'Skanuj przedmiot'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={() => pick(false)}>
          <Text style={s.btnGhostText}>Z galerii</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={s.center}>
          <ActivityIndicator color={c.green} size="large" />
          <Text style={s.dim}>Rozpoznaję przedmiot i sprawdzam oferty…</Text>
        </View>
      )}

      {error && <Text style={s.error}>{error}</Text>}

      {result && (
        <View style={s.card}>
          <Text style={s.name}>{result.name}</Text>
          <Text style={s.dim}>{result.condition}</Text>

          <Text style={s.price}>{zl(result.price_fast)}</Text>
          <Text style={s.dim}>sugerowana cena na szybką sprzedaż</Text>

          <View style={s.range}>
            <View style={s.rangeBox}>
              <Text style={s.rangeLabel}>Najniższa</Text>
              <Text style={s.rangeVal}>{zl(result.price_low)}</Text>
            </View>
            <View style={s.rangeBox}>
              <Text style={s.rangeLabel}>Typowa</Text>
              <Text style={s.rangeVal}>{zl(result.price_mid)}</Text>
            </View>
            <View style={s.rangeBox}>
              <Text style={s.rangeLabel}>Najwyższa</Text>
              <Text style={s.rangeVal}>{zl(result.price_high)}</Text>
            </View>
          </View>

          {result.notes ? <Text style={s.notes}>{result.notes}</Text> : null}

          {result.offers?.length > 0 && (
            <>
              <Text style={s.section}>Podobne oferty ({result.offers.length})</Text>
              {result.offers.map((o, i) => (
                <TouchableOpacity key={i} style={s.offer} onPress={() => o.link && Linking.openURL(o.link)}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.offerTitle} numberOfLines={2}>{o.title}</Text>
                    <Text style={s.dim}>{o.source}</Text>
                  </View>
                  <Text style={s.offerPrice}>{zl(o.price)}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  lead: { color: c.dim, fontSize: 16, lineHeight: 23, marginBottom: 20 },
  photo: { width: '100%', height: 240, borderRadius: 16, marginBottom: 16, backgroundColor: c.card },
  row: { flexDirection: 'row', gap: 10 },
  btn: { paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  btnMain: { flex: 2, backgroundColor: c.green },
  btnMainText: { color: '#04120a', fontWeight: '800', fontSize: 16 },
  btnGhost: { flex: 1, borderWidth: 1, borderColor: c.line },
  btnGhostText: { color: c.text, fontWeight: '600', fontSize: 15 },
  center: { alignItems: 'center', gap: 12, marginTop: 32 },
  dim: { color: c.dim, fontSize: 14 },
  error: { color: c.red, marginTop: 20, fontSize: 15, lineHeight: 21 },
  card: { marginTop: 24, backgroundColor: c.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: c.line },
  name: { color: c.text, fontSize: 20, fontWeight: '700', marginBottom: 2 },
  price: { color: c.green, fontSize: 44, fontWeight: '800', marginTop: 16 },
  range: { flexDirection: 'row', gap: 8, marginTop: 18 },
  rangeBox: { flex: 1, backgroundColor: c.bg, borderRadius: 12, padding: 10 },
  rangeLabel: { color: c.dim, fontSize: 12 },
  rangeVal: { color: c.text, fontSize: 16, fontWeight: '700', marginTop: 2 },
  notes: { color: c.dim, marginTop: 16, lineHeight: 20 },
  section: { color: c.text, fontWeight: '700', fontSize: 16, marginTop: 22, marginBottom: 6 },
  offer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.line },
  offerTitle: { color: c.text, fontSize: 14, marginBottom: 2 },
  offerPrice: { color: c.text, fontWeight: '700', fontSize: 16 },
});
