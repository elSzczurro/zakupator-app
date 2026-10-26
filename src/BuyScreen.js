import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Linking, Keyboard } from 'react-native';
import { search } from './api';
import { c } from './theme';

export default function BuyScreen() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function go() {
    if (!q.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    try {
      const r = await search(q.trim());
      setItems(r.items);
    } catch (e) {
      setError(e.message);
      setItems(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.root}>
      <View style={s.bar}>
        <TextInput
          style={s.input}
          placeholder="Czego szukasz? np. iPhone 13 128 GB"
          placeholderTextColor={c.dim}
          value={q}
          onChangeText={setQ}
          onSubmitEditing={go}
          returnKeyType="search"
        />
        <TouchableOpacity style={s.go} onPress={go}>
          <Text style={s.goText}>Szukaj</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color={c.green} size="large" style={{ marginTop: 40 }} />}
      {error && <Text style={s.error}>{error}</Text>}
      {items && items.length === 0 && <Text style={s.empty}>Brak ofert. Spróbuj podać inną nazwę produktu.</Text>}
      {!items && !loading && !error && (
        <Text style={s.empty}>Wpisz nazwę produktu. Zakupator przeszuka sklepy w internecie i pokaże najtańsze oferty na górze.</Text>
      )}

      <FlatList
        data={items || []}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={({ item, index }) => (
          <TouchableOpacity style={[s.card, index === 0 && s.best]} onPress={() => item.link && Linking.openURL(item.link)}>
            {item.thumbnail ? <Image source={{ uri: item.thumbnail }} style={s.thumb} /> : <View style={s.thumb} />}
            <View style={{ flex: 1 }}>
              {index === 0 && <Text style={s.badge}>Najtaniej</Text>}
              <Text style={s.title} numberOfLines={2}>{item.title}</Text>
              <Text style={s.src}>{item.source}{item.delivery ? ` · ${item.delivery}` : ''}</Text>
            </View>
            <Text style={s.price}>{item.price_text}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  bar: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 4 },
  input: { flex: 1, backgroundColor: c.card, color: c.text, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, borderWidth: 1, borderColor: c.line },
  go: { backgroundColor: c.green, borderRadius: 14, paddingHorizontal: 18, justifyContent: 'center' },
  goText: { color: '#04120a', fontWeight: '800' },
  empty: { color: c.dim, textAlign: 'center', margin: 32, lineHeight: 22, fontSize: 15 },
  error: { color: c.red, margin: 20, lineHeight: 21 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.card, borderRadius: 16, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: c.line },
  best: { borderColor: c.green },
  thumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: c.bg },
  badge: { color: c.green, fontWeight: '700', fontSize: 12, marginBottom: 2 },
  title: { color: c.text, fontSize: 14, lineHeight: 19 },
  src: { color: c.dim, fontSize: 12, marginTop: 3 },
  price: { color: c.text, fontWeight: '800', fontSize: 16 },
});
