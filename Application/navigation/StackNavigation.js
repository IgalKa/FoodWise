import 'react-native-gesture-handler';
import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import SearchProduct from '../screens/SearchProduct';
import EditList from '../screens/EditList';
import DrawerNavigator from './DrawerNavigation';



export default function Navigation() {


    const Stack = createNativeStackNavigator();

    return (
        <Stack.Navigator initialRouteName='Welcome' screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="Inventory" component={DrawerNavigator} />
            <Stack.Screen name="SearchProduct" component={SearchProduct} />
            <Stack.Screen name="EditList" component={EditList} />
        </Stack.Navigator>
    );

}
