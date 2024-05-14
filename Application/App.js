import 'react-native-gesture-handler';
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { I18nManager } from 'react-native';
import Navigation from './navigation/StackNavigation';

I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

// const Stack = createNativeStackNavigator();
// const Drawer = createDrawerNavigator();

function App() {
  return (
    <NavigationContainer>
      <Navigation />
    </NavigationContainer>
  );
}




// function RootNavigator() {
//   return (
//     <Stack.Navigator initialRouteName='Welcome' screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="Main" component={MainScreen} />
//       <Stack.Screen name="Welcome" component={WelcomeScreen} />
//       <Stack.Screen name="Login" component={LoginScreen} />
//       <Stack.Screen name="Signup" component={SignupScreen} />
//       <Stack.Screen name="Inventory" component={InventoryScreen} />
//     </Stack.Navigator>
//   );
// }

// function MainScreen() {
//   return (
//     <Drawer.Navigator screenOptions={{
//       headerShown: true,
//       headerTransparent: true
//     }}>
//       <Drawer.Screen name="Inventory" component={InventoryScreen} />
//       <Drawer.Screen name="Welcome" component={WelcomeScreen} />
//       <Drawer.Screen name="Login" component={LoginScreen} />
//       <Drawer.Screen name="Signup" component={SignupScreen} />
//     </Drawer.Navigator>
//   );
// }

export default App;