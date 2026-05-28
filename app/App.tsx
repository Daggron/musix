import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider} from 'react-native-safe-area-context';

function SongsScreen(): React.JSX.Element {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Songs</Text>
    </View>
  );
}

function SearchScreen(): React.JSX.Element {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Search</Text>
    </View>
  );
}

function PlaylistsScreen(): React.JSX.Element {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Playlists</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator();

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#f1e6cf',
              borderTopColor: 'rgba(42, 30, 20, 0.12)',
            },
            tabBarActiveTintColor: '#8a2e1f',
            tabBarInactiveTintColor: '#7a5d44',
            tabBarLabelStyle: {fontSize: 10, letterSpacing: 1},
          }}>
          <Tab.Screen name="Songs" component={SongsScreen} />
          <Tab.Screen name="Search" component={SearchScreen} />
          <Tab.Screen name="Playlists" component={PlaylistsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1e6cf',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#2a1e14',
  },
});

export default App;
