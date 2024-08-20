import 'react-native-gesture-handler';
import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import SearchProduct from '../screens/SearchProduct';
import EditList from '../screens/EditList';
import InitialLoadingScreen from '../screens/initialLoadingScreen';
import DrawerNavigator from './DrawerNavigation';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';



export default function Navigation() {
    const Stack = createNativeStackNavigator();
    const { token, isLoading } = useAuth();

    if (isLoading) {
        return <InitialLoadingScreen />;
    }

    return (
        <Stack.Navigator initialRouteName={token ? 'Inventory' : 'Welcome'} screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="Inventory" component={DrawerNavigator} />
            <Stack.Screen name="SearchProduct" component={SearchProduct} />
            <Stack.Screen name="EditList" component={EditList} />
        </Stack.Navigator>
    );
}
