import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {CustomTabBar} from './src/components';
import {SongsScreen} from './src/screens/SongsScreen';
import {SearchScreen} from './src/screens/SearchScreen';
import {PlaylistsScreen} from './src/screens/PlaylistsScreen';
import {PlaylistDetailScreen} from './src/screens/PlaylistDetailScreen';
import {NowPlayingScreen} from './src/screens/NowPlayingScreen';
import {EqualizerScreen} from './src/screens/EqualizerScreen';
import {AddMusicScreen} from './src/screens/AddMusicScreen';

type PlaylistsStackParams = {
  PlaylistsList: undefined;
  PlaylistDetail: {playlistId: string};
};

const PlaylistsStack = createNativeStackNavigator<PlaylistsStackParams>();

function PlaylistsStackScreen() {
  return (
    <PlaylistsStack.Navigator screenOptions={{headerShown: false}}>
      <PlaylistsStack.Screen name="PlaylistsList" component={PlaylistsScreen} />
      <PlaylistsStack.Screen
        name="PlaylistDetail"
        component={PlaylistDetailScreen}
      />
    </PlaylistsStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

type RootStackParams = {
  Main: undefined;
  NowPlaying: undefined;
  Equalizer: undefined;
  AddMusic: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParams>();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{headerShown: false}}>
      <Tab.Screen name="Songs" component={SongsScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Playlists" component={PlaylistsStackScreen} />
    </Tab.Navigator>
  );
}

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{headerShown: false}}>
          <RootStack.Screen name="Main" component={MainTabs} />
          <RootStack.Screen
            name="NowPlaying"
            component={NowPlayingScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <RootStack.Screen
            name="Equalizer"
            component={EqualizerScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <RootStack.Screen
            name="AddMusic"
            component={AddMusicScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
