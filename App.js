import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ScrollView, SafeAreaView, StatusBar,
  ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = 'AQ.Ab8RN6L5FvRVcFXHFj9CUSOmPqY1H53a9DAUKZPmnCA1Uoc-ZA';
const ACCENT = '#D85A30';

const SAMPLE_RECIPES = [
  {
    id: '1', title: 'Paste cu Unt si Usturoi', source: 'instagram',
    url: 'https://instagram.com', time: '20 min', servings: '2',
    tags: ['paste', 'rapid'],
    ingredients: [
      {amount:'200g', name:'spaghetti'},
      {amount:'4 catei', name:'usturoi'},
      {amount:'60g', name:'unt'},
      {amount:'30g', name:'parmezan'}
    ],
    steps: [
      'Fierbe pastele in apa sarata.',
      'Caleste usturoiul in unt pana devine auriu.',
      'Amesteca pastele cu untul si usturoiul.',
      'Adauga parmezan si serveste.'
    ]
  },
  {
    id: '2', title: 'Mousse de Ciocolata', source: 'tiktok',
    url: 'https://tiktok.com', time: '15 min + racire', servings: '4',
    tags: ['desert', 'ciocolata'],
    ingredients: [
      {amount:'200g', name:'ciocolata neagra'},
      {amount:'4', name:'oua, separate'},
      {amount:'2 linguri', name:'zahar'},
      {amount:'1 praf', name:'sare'}
    ],
    steps: [
      'Topeste ciocolata si las-o sa se raceasca.',
      'Incorporeaza galbenusurile in ciocolata.',
      'Bate albusurile spuma cu zahar.',
      'Incorporeaza albusurile in ciocolata. Raceste 2 ore.'
    ]
  }
];

export default function App() {
  const [tab, setTab] = useState('import');
  const [recipes, setRecipes] = useState(SAMPLE_RECIPES);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('recipes').then(v => {
      if (v) setRecipes(JSON.parse(v));
    });
  }, []);

  const saveRecipes = async (data) => {
    await AsyncStorage.setItem('recipes', JSON.stringify(data));
    setRecipes(data);
  };

  const importRecipe = async () => {
    if (!url.trim()) {
      Alert.alert('Eroare', 'Introdu un link mai intai');
      return;
    }
    const isIG = url.includes('instagram.com');
    const isTT = url.includes('tiktok.com');
    if (!isIG && !isTT) {
      Alert.alert('Eroare', 'Doar linkuri Instagram si TikTok sunt suportate');
      return;
    }
    setLoading(true);
    setStatus('Se extrage reteta cu AI...');
    try {
      const platform = isIG ? 'Instagram' : 'TikTok';
      const prompt = 'Genereaza o reteta realista pentru acest link ' + platform + ': ' + url + '. Returneaza DOAR JSON valid, fara markdown: {"title":"...","time":"...","servings":"4","tags":["tag1","tag2"],"ingredients":[{"amount":"...","name":"..."}],"steps":["pas1","pas2"]}';
      const res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + API_KEY,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            contents: [{parts: [{text: prompt}]}]
          })
        }
      );
      const data = await res.json();
      const text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
      const recipe = JSON.parse(text);
      const newRecipes = [...recipes, {
        id: Date.now().toString(),
        source: isIG ? 'instagram' : 'tiktok',
        url: url,
        ...recipe
      }];
      await saveRecipes(newRecipes);
      setStatus('Reteta salvata: ' + recipe.title);
      setUrl('');
    } catch(e) {
      setStatus('Eroare: Verifica cheia API si conexiunea la internet.');
    }
    setLoading(false);
  };

  const openRecipe = (item) => {
    setSelected(item);
    setTab('detail');
  };

  const renderCard = ({item}) => (
    <TouchableOpacity style={styles.card} onPress={() => openRecipe(item)}>
      <View style={[styles.sourceBadge, {backgroundColor: item.source === 'instagram' ? '#FAECE7' : '#E1F5EE'}]}>
        <Text style={[styles.sourceText, {color: item.source === 'instagram' ? '#993C1D' : '#0F6E56'}]}>
          {item.source === 'instagram' ? 'Instagram' : 'TikTok'}
        </Text>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardMeta}>{item.time} · {item.servings} portii</Text>
      <View style={styles.tagRow}>
        {item.tags.map((t, i) => (
          <Text key={i} style={styles.tag}>{t}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );

  if (tab === 'detail' && selected) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView style={styles.scroll}>
          <TouchableOpacity onPress={() => setTab('recipes')} style={styles.backBtn}>
            <Text style={styles.backText}>← Inapoi</Text>
          </TouchableOpacity>
          <Text style={styles.detailTitle}>{selected.title}</Text>
          <Text style={styles.detailMeta}>{selected.time} · {selected.servings} portii</Text>
          <Text style={styles.sectionHead}>Ingrediente</Text>
          {selected.ingredients.map((ing, i) => (
            <View key={i} style={styles.ingRow}>
              <Text style={styles.ingAmt}>{ing.amount}</Text>
              <Text style={styles.ingName}>{ing.name}</Text>
            </View>
          ))}
          <Text style={styles.sectionHead}>Mod de preparare</Text>
          {selected.steps.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{s}</Text>
            </View>
          ))}
          <View style={{height: 40}} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.logo}>dish<Text style={{color: ACCENT}}>.</Text>saved</Text>
      </View>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'import' && styles.tabActive]}
          onPress={() => setTab('import')}>
          <Text style={[styles.tabText, tab === 'import' && styles.tabTextActive]}>Import</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'recipes' && styles.tabActive]}
          onPress={() => setTab('recipes')}>
          <Text style={[styles.tabText, tab === 'recipes' && styles.tabTextActive]}>Retetele mele</Text>
        </TouchableOpacity>
      </View>

      {tab === 'import' && (
        <ScrollView style={styles.scroll}>
          <View style={styles.importBox}>
            <Text style={styles.importTitle}>Importa din social media</Text>
            <Text style={styles.importDesc}>Lipeste un link Instagram sau TikTok — AI extrage reteta automat.</Text>
            <TextInput
              style={styles.urlInput}
              value={url}
              onChangeText={setUrl}
              placeholder="https://www.instagram.com/reel/..."
              placeholderTextColor="#aaa"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.importBtn, loading && {opacity: 0.5}]}
              onPress={importRecipe}
              disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.importBtnText}>Extrage Reteta</Text>
              }
            </TouchableOpacity>
            {!!status && (
              <Text style={[styles.status, status.startsWith('Eroare') && {color: '#A32D2D', backgroundColor: '#FCEBEB'}]}>
                {status}
              </Text>
            )}
          </View>
          <Text style={styles.sectionLabel}>Salvate recent</Text>
          {recipes.slice().reverse().map((item) => (
            <TouchableOpacity key={item.id} style={styles.card} onPress={() => openRecipe(item)}>
              <View style={[styles.sourceBadge, {backgroundColor: item.source === 'instagram' ? '#FAECE7' : '#E1F5EE'}]}>
                <Text style={[styles.sourceText, {color: item.source === 'instagram' ? '#993C1D' : '#0F6E56'}]}>
                  {item.source === 'instagram' ? 'Instagram' : 'TikTok'}
                </Text>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>{item.time} · {item.servings} portii</Text>
              <View style={styles.tagRow}>
                {item.tags.map((t, i) => (
                  <Text key={i} style={styles.tag}>{t}</Text>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {tab === 'recipes' && (
        <FlatList
          data={recipes}
          keyExtractor={r => r.id}
          renderItem={renderCard}
          contentContainerStyle={styles.scroll}
          ListEmptyComponent={
            <Text style={styles.empty}>Nicio reteta salvata. Importa una!</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#fff'},
  header: {padding: 16, borderBottomWidth: 0.5, borderColor: '#e0e0e0'},
  logo: {fontSize: 22, fontWeight: '700', letterSpacing: -0.5},
  tabBar: {flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#e0e0e0'},
  tabBtn: {flex: 1, padding: 12, alignItems: 'center'},
  tabActive: {borderBottomWidth: 2, borderBottomColor: '#D85A30'},
  tabText: {fontSize: 14, color: '#888'},
  tabTextActive: {color: '#111', fontWeight: '500'},
  scroll: {padding: 16},
  importBox: {backgroundColor: '#f8f8f8', borderRadius: 12, padding: 16, marginBottom: 16},
  importTitle: {fontSize: 16, fontWeight: '600', marginBottom: 4},
  importDesc: {fontSize: 13, color: '#666', marginBottom: 12, lineHeight: 18},
  urlInput: {backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 13, marginBottom: 10},
  importBtn: {backgroundColor: '#D85A30', borderRadius: 8, padding: 12, alignItems: 'center'},
  importBtnText: {color: '#fff', fontWeight: '600', fontSize: 14},
  status: {marginTop: 10, padding: 10, backgroundColor: '#EAF3DE', borderRadius: 8, fontSize: 13, color: '#27500A'},
  sectionLabel: {fontSize: 13, fontWeight: '500', color: '#888', marginBottom: 10, marginTop: 4},
  card: {backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#e0e0e0', borderRadius: 12, padding: 14, marginBottom: 10},
  sourceBadge: {alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginBottom: 6},
  sourceText: {fontSize: 11, fontWeight: '500'},
  cardTitle: {fontSize: 15, fontWeight: '600', marginBottom: 4},
  cardMeta: {fontSize: 12, color: '#888', marginBottom: 6},
  tagRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 4},
  tag: {fontSize: 11, backgroundColor: '#f0f0f0', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, color: '#666'},
  empty: {textAlign: 'center', color: '#aaa', marginTop: 60, fontSize: 14},
  backBtn: {marginBottom: 16},
  backText: {color: '#D85A30', fontSize: 14},
  detailTitle: {fontSize: 22, fontWeight: '700', marginBottom: 6, lineHeight: 28},
  detailMeta: {fontSize: 13, color: '#888', marginBottom: 16},
  sectionHead: {fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, color: '#888', marginBottom: 10, marginTop: 4, paddingBottom: 6, borderBottomWidth: 0.5, borderColor: '#f0f0f0'},
  ingRow: {flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 0.5, borderColor: '#f5f5f5'},
  ingAmt: {fontWeight: '600', fontSize: 13, width: 75},
  ingName: {fontSize: 13, flex: 1, color: '#333'},
  stepRow: {flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderColor: '#f5f5f5'},
  stepNum: {width: 22, height: 22, borderRadius: 11, backgroundColor: '#D85A30', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0},
  stepNumText: {color: '#fff', fontSize: 11, fontWeight: '700'},
  stepText: {fontSize: 13, flex: 1, lineHeight: 20, color: '#333'},
});