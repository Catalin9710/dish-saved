import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ScrollView, SafeAreaView, StatusBar,
  ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = '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';

const C = {
  bg: '#0F0F0F', card: '#1A1A1A', cardBorder: '#2A2A2A',
  accent: '#E53935', accentDark: '#B71C1C',
  text: '#FFFFFF', textSub: '#AAAAAA', textMuted: '#666666',
  input: '#1F1F1F', inputBorder: '#333333',
  success: '#1B4A1B', successText: '#81C784',
  error: '#4A1B1B', errorText: '#EF9A9A',
  igBadge: '#3A1A1A', igText: '#EF9A9A',
  ttBadge: '#1A2E1A', ttText: '#81C784',
};

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
    if (!url.trim()) { Alert.alert('Eroare', 'Introdu un link mai intai'); return; }
    const isIG = url.includes('instagram.com');
    const isTT = url.includes('tiktok.com');
    if (!isIG && !isTT) { Alert.alert('Eroare', 'Doar linkuri Instagram si TikTok sunt suportate'); return; }
    setLoading(true);
    setStatus('Se extrage reteta cu AI...');
    try {
      const platform = isIG ? 'Instagram' : 'TikTok';
      const prompt = 'Genereaza o reteta realista pentru acest link ' + platform + ': ' + url + '. Returneaza DOAR JSON valid, fara markdown: {"title":"...","time":"...","servings":"4","tags":["tag1","tag2"],"ingredients":[{"amount":"...","name":"..."}],"steps":["pas1","pas2"]}';
      const res = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + API_KEY
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1000
          })
        }
      );
      const data = await res.json();
      if (data.error) {
        setStatus('Eroare API: ' + data.error.message);
        setLoading(false);
        return;
      }
      const text = data.choices[0].message.content.replace(/```json|```/g, '').trim();
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
      setStatus('Eroare: ' + e.message);
    }
    setLoading(false);
  };

  const openRecipe = (item) => { setSelected(item); setTab('detail'); };

  const RecipeCard = ({item}) => (
    <TouchableOpacity style={styles.card} onPress={() => openRecipe(item)} activeOpacity={0.7}>
      <View style={[styles.sourceBadge, {backgroundColor: item.source === 'instagram' ? C.igBadge : C.ttBadge}]}>
        <Text style={[styles.sourceText, {color: item.source === 'instagram' ? C.igText : C.ttText}]}>
          {item.source === 'instagram' ? 'Instagram' : 'TikTok'}
        </Text>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardMeta}>{item.time} · {item.servings} portii</Text>
      <View style={styles.tagRow}>
        {item.tags.map((t, i) => <Text key={i} style={styles.tag}>{t}</Text>)}
      </View>
    </TouchableOpacity>
  );

  if (tab === 'detail' && selected) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => setTab('recipes')} style={styles.backBtn}>
            <Text style={styles.backText}>← Inapoi</Text>
          </TouchableOpacity>
          <View style={[styles.sourceBadge, {backgroundColor: selected.source === 'instagram' ? C.igBadge : C.ttBadge, marginBottom: 14}]}>
            <Text style={[styles.sourceText, {color: selected.source === 'instagram' ? C.igText : C.ttText}]}>
              {selected.source === 'instagram' ? 'Instagram' : 'TikTok'}
            </Text>
          </View>
          <Text style={styles.detailTitle}>{selected.title}</Text>
          <Text style={styles.detailMeta}>{selected.time} · {selected.servings} portii</Text>
          <View style={styles.divider} />
          <Text style={styles.sectionHead}>Ingrediente</Text>
          {selected.ingredients.map((ing, i) => (
            <View key={i} style={styles.ingRow}>
              <Text style={styles.ingAmt}>{ing.amount}</Text>
              <Text style={styles.ingName}>{ing.name}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <Text style={styles.sectionHead}>Mod de preparare</Text>
          {selected.steps.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{s}</Text>
            </View>
          ))}
          <View style={{height: 50}} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={styles.header}>
        <Text style={styles.logo}>dish<Text style={{color: C.accent}}>.</Text>saved</Text>
        <Text style={styles.logoSub}>retete din social media</Text>
      </View>
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'import' && styles.tabActive]} onPress={() => setTab('import')}>
          <Text style={[styles.tabText, tab === 'import' && styles.tabTextActive]}>Import</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'recipes' && styles.tabActive]} onPress={() => setTab('recipes')}>
          <Text style={[styles.tabText, tab === 'recipes' && styles.tabTextActive]}>Retetele mele</Text>
        </TouchableOpacity>
      </View>
      {tab === 'import' && (
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.importBox}>
            <Text style={styles.importTitle}>Importa din social media</Text>
            <Text style={styles.importDesc}>Lipeste un link Instagram sau TikTok — AI extrage reteta automat.</Text>
            <TextInput
              style={styles.urlInput}
              value={url}
              onChangeText={setUrl}
              placeholder="https://www.instagram.com/reel/..."
              placeholderTextColor={C.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={[styles.importBtn, loading && {opacity: 0.5}]} onPress={importRecipe} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.importBtnText}>Extrage Reteta</Text>
              }
            </TouchableOpacity>
            {!!status && (
              <Text style={[styles.status, status.startsWith('Eroare') && {color: C.errorText, backgroundColor: C.error}]}>
                {status}
              </Text>
            )}
          </View>
          <Text style={styles.sectionLabel}>Salvate recent</Text>
          {recipes.slice().reverse().map((item) => <RecipeCard key={item.id} item={item} />)}
          <View style={{height: 20}} />
        </ScrollView>
      )}
      {tab === 'recipes' && (
        <FlatList
          data={recipes}
          keyExtractor={r => r.id}
          renderItem={({item}) => <RecipeCard item={item} />}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.empty}>Nicio reteta salvata.{'\n'}Importa una!</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: C.bg},
  header: {paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5, borderColor: C.cardBorder, backgroundColor: C.bg},
  logo: {fontSize: 26, fontWeight: '800', letterSpacing: -0.5, color: C.text},
  logoSub: {fontSize: 11, color: C.textMuted, marginTop: 2},
  tabBar: {flexDirection: 'row', borderBottomWidth: 0.5, borderColor: C.cardBorder, backgroundColor: C.bg},
  tabBtn: {flex: 1, paddingVertical: 14, alignItems: 'center'},
  tabActive: {borderBottomWidth: 2, borderBottomColor: C.accent},
  tabText: {fontSize: 15, color: C.textMuted},
  tabTextActive: {color: C.text, fontWeight: '600'},
  scroll: {padding: 16},
  importBox: {backgroundColor: C.accentDark, borderWidth: 0.5, borderColor: '#7B1111', borderRadius: 16, padding: 18, marginBottom: 20},
  importTitle: {fontSize: 17, fontWeight: '700', marginBottom: 6, color: '#FFCDD2'},
  importDesc: {fontSize: 13, color: '#EF9A9A', marginBottom: 14, lineHeight: 19},
  urlInput: {backgroundColor: '#1A0A0A', borderWidth: 0.5, borderColor: '#7B1111', borderRadius: 10, padding: 12, fontSize: 13, marginBottom: 12, color: C.text},
  importBtn: {backgroundColor: C.accent, borderRadius: 10, padding: 14, alignItems: 'center'},
  importBtnText: {color: '#fff', fontWeight: '700', fontSize: 15},
  status: {marginTop: 12, padding: 12, backgroundColor: C.success, borderRadius: 10, fontSize: 13, color: C.successText, lineHeight: 18},
  sectionLabel: {fontSize: 11, fontWeight: '700', color: C.textMuted, marginBottom: 12, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1},
  card: {backgroundColor: C.card, borderWidth: 0.5, borderColor: C.cardBorder, borderRadius: 16, padding: 16, marginBottom: 12},
  sourceBadge: {alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 10},
  sourceText: {fontSize: 11, fontWeight: '600'},
  cardTitle: {fontSize: 16, fontWeight: '700', marginBottom: 5, color: C.text},
  cardMeta: {fontSize: 13, color: C.textSub, marginBottom: 8},
  tagRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 5},
  tag: {fontSize: 11, backgroundColor: '#2A2A2A', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8, color: C.textSub},
  empty: {textAlign: 'center', color: C.textMuted, marginTop: 80, fontSize: 15, lineHeight: 24},
  backBtn: {marginBottom: 20, marginTop: 4},
  backText: {color: C.accent, fontSize: 15, fontWeight: '600'},
  detailTitle: {fontSize: 24, fontWeight: '800', marginBottom: 8, lineHeight: 30, color: C.text},
  detailMeta: {fontSize: 14, color: C.textSub, marginBottom: 16},
  divider: {height: 0.5, backgroundColor: C.cardBorder, marginVertical: 16},
  sectionHead: {fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: C.textMuted, marginBottom: 12},
  ingRow: {flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 0.5, borderColor: C.cardBorder, alignItems: 'center'},
  ingAmt: {fontWeight: '700', fontSize: 13, width: 85, color: C.accent},
  ingName: {fontSize: 14, flex: 1, color: C.text},
  stepRow: {flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 0.5, borderColor: C.cardBorder, alignItems: 'flex-start'},
  stepNum: {width: 26, height: 26, borderRadius: 13, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1},
  stepNumText: {color: '#fff', fontSize: 12, fontWeight: '700'},
  stepText: {fontSize: 14, flex: 1, lineHeight: 21, color: C.text},
});