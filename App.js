import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ScrollView, SafeAreaView, StatusBar,
  ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = '';
const ACCENT = '#D85A30';

const SAMPLE_RECIPES = [
  { id: '1', title: 'Crispy Garlic Butter Pasta', source: 'instagram',
    url: 'https://instagram.com/reel/example', time: '20 min', servings: '2',
    tags: ['pasta', 'quick'], photo: null,
    ingredients: [{amount:'200g',name:'spaghetti'},{amount:'4 cloves',name:'garlic'},{amount:'60g',name:'butter'},{amount:'30g',name:'parmesan'}],
    steps: ['Cook pasta in salted water. Reserve some pasta water.','Fry garlic in butter until golden.','Toss pasta with garlic butter and pasta water.','Top with parmesan and serve.'] },
  { id: '2', title: 'Chocolate Mousse', source: 'tiktok',
    url: 'https://tiktok.com/@user/video/example', time: '15 min + chill', servings: '4',
    tags: ['dessert', 'chocolate'], photo: null,
    ingredients: [{amount:'200g',name:'dark chocolate'},{amount:'4',name:'eggs, separated'},{amount:'2 tbsp',name:'sugar'},{amount:'1 pinch',name:'salt'}],
    steps: ['Melt chocolate and let cool.','Whisk yolks into chocolate.','Whip whites to stiff peaks with sugar.','Fold whites into chocolate. Chill 2 hours.'] },
];

export default function App() {
  const [tab, setTab] = useState('import');
  const [recipes, setRecipes] = useState(SAMPLE_RECIPES);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('recipes').then(v => { if (v) setRecipes(JSON.parse(v)); });
  }, []);

  const save = async (data) => {
    await AsyncStorage.setItem('recipes', JSON.stringify(data));
    setRecipes(data);
  };

  const importRecipe = async () => {
    if (!url.trim()) { Alert.alert('Enter a URL first'); return; }
    const isIG = url.includes('instagram.com');
    const isTT = url.includes('tiktok.com');
    if (!isIG && !isTT) { Alert.alert('Only Instagram and TikTok links supported'); return; }
    setLoading(true);
    setStatus('Extracting recipe with AI...');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1000,
          messages: [{ role: 'user', content: `Generate a realistic recipe for this ${isIG?'Instagram':'TikTok'} link: ${url}. Return ONLY valid JSON: {"title":"...","time":"...","servings":"4","tags":["tag1","tag2"],"ingredients":[{"amount":"...","name":"..."}],"steps":["step1","step2"]}` }]
        })
      });
      const data = await res.json();
      const text = data.content[0].text.replace(/```json|```/g,'').trim();
      const recipe = JSON.parse(text);
      const newRecipes = [...recipes, { id: Date.now().toString(), source: isIG?'instagram':'tiktok', url, photo: null, ...recipe }];
      await save(newRecipes);
      setStatus('Recipe saved: ' + recipe.title);
      setUrl('');
    } catch(e) {
      setStatus('Error: Could not extract recipe. Check your API key and internet.');
    }
    setLoading(false);
  };

  const RecipeCard = ({item}) => (
     { setSelected(item); setTab('detail'); }}>
      
        
          {item.source==='instagram' ? 'Instagram' : 'TikTok'}
        
      
      {item.title}
      {item.time} · {item.servings} servings
      
        {item.tags.map(t => {t})}
      
    
  );

  if (tab === 'detail' && selected) return (
    
      
         setTab('recipes')} style={styles.backBtn}>
          ← Back
        
        {selected.title}
        {selected.time} · {selected.servings} servings
        Ingredients
        {selected.ingredients.map((ing,i) => (
          
            {ing.amount}
            {ing.name}
          
        ))}
        Method
        {selected.steps.map((s,i) => (
          
            {i+1}
            {s}
          
        ))}
        
      
    
  );

  return (
    
      
      
        dish.saved
      
      
        {['import','recipes'].map(t => (
           setTab(t)}>
            {t==='import' ? 'Import' : 'My Recipes'}
          
        ))}
      
      {tab==='import' && (
        
          
            Import from social media
            Paste an Instagram or TikTok link — AI extracts the recipe.
            
            
              {loading ?  : Extract Recipe}
            
            {!!status && {status}}
          
          Recently saved
          {recipes.slice().reverse().map(r => )}
        
      )}
      {tab==='recipes' && (
        r.id} renderItem={({item})=>}
          contentContainerStyle={styles.scroll}
          ListEmptyComponent={No recipes yet. Import one!}/>
      )}
    
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#fff'},
  header:{padding:16,borderBottomWidth:0.5,borderColor:'#e0e0e0'},
  logo:{fontSize:22,fontWeight:'700',letterSpacing:-0.5},
  tabBar:{flexDirection:'row',borderBottomWidth:0.5,borderColor:'#e0e0e0'},
  tabBtn:{flex:1,padding:12,alignItems:'center'},
  tabActive:{borderBottomWidth:2,borderBottomColor:'#D85A30'},
  tabText:{fontSize:14,color:'#888'},
  tabTextActive:{color:'#111',fontWeight:'500'},
  scroll:{padding:16},
  importBox:{backgroundColor:'#f8f8f8',borderRadius:12,padding:16,marginBottom:16},
  importTitle:{fontSize:16,fontWeight:'600',marginBottom:4},
  importDesc:{fontSize:13,color:'#666',marginBottom:12,lineHeight:18},
  urlInput:{backgroundColor:'#fff',borderWidth:0.5,borderColor:'#ddd',borderRadius:8,padding:10,fontSize:13,marginBottom:10},
  importBtn:{backgroundColor:'#D85A30',borderRadius:8,padding:12,alignItems:'center'},
  importBtnText:{color:'#fff',fontWeight:'600',fontSize:14},
  status:{marginTop:10,padding:10,backgroundColor:'#EAF3DE',borderRadius:8,fontSize:13,color:'#27500A'},
  sectionLabel:{fontSize:13,fontWeight:'500',color:'#888',marginBottom:10,marginTop:4},
  card:{backgroundColor:'#fff',borderWidth:0.5,borderColor:'#e0e0e0',borderRadius:12,padding:14,marginBottom:10},
  sourceBadge:{alignSelf:'flex-start',paddingHorizontal:8,paddingVertical:2,borderRadius:10,marginBottom:6},
  sourceText:{fontSize:11,fontWeight:'500'},
  cardTitle:{fontSize:15,fontWeight:'600',marginBottom:4},
  cardMeta:{fontSize:12,color:'#888',marginBottom:6},
  tagRow:{flexDirection:'row',flexWrap:'wrap',gap:4},
  tag:{fontSize:11,backgroundColor:'#f0f0f0',paddingHorizontal:7,paddingVertical:2,borderRadius:8,color:'#666'},
  empty:{textAlign:'center',color:'#aaa',marginTop:60,fontSize:14},
  backBtn:{marginBottom:16},
  backText:{color:'#D85A30',fontSize:14},
  detailTitle:{fontSize:22,fontWeight:'700',marginBottom:6,lineHeight:28},
  detailMeta:{fontSize:13,color:'#888',marginBottom:16},
  sectionHead:{fontSize:11,fontWeight:'600',textTransform:'uppercase',letterSpacing:0.8,color:'#888',marginBottom:10,marginTop:4,paddingBottom:6,borderBottomWidth:0.5,borderColor:'#f0f0f0'},
  ingRow:{flexDirection:'row',paddingVertical:6,borderBottomWidth:0.5,borderColor:'#f5f5f5'},
  ingAmt:{fontWeight:'600',fontSize:13,width:75},
  ingName:{fontSize:13,flex:1,color:'#333'},
  stepRow:{flexDirection:'row',gap:10,paddingVertical:8,borderBottomWidth:0.5,borderColor:'#f5f5f5'},
  stepNum:{width:22,height:22,borderRadius:11,backgroundColor:'#D85A30',alignItems:'center',justifyContent:'center',marginTop:1,flexShrink:0},
  stepNumText:{color:'#fff',fontSize:11,fontWeight:'700'},
  stepText:{fontSize:13,flex:1,lineHeight:20,color:'#333'},
});