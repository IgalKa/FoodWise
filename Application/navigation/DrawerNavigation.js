import 'react-native-gesture-handler';
import * as React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import InventoryScreen from '../screens/InventoryScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import MyRefrigeratorsScreen from '../screens/MyRefrigeratorsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ShoppingList from '../screens/ShoppingList';
import RecipesScreen from '../screens/RecipesScreen';
import ConsumptionScreen from '../screens/ConsumptionScreen';



const DrawerNavigator = () => {

    const Drawer = createDrawerNavigator()


    return (
        <Drawer.Navigator screenOptions={{
            drawerStyle: {
                backgroundColor: '#c6cbef',
                width: 240,
            },
            headerShown: true,
            headerTransparent: false,
            headerStyle: {
                backgroundColor: '#505a91',

            },
            headerTintColor: '#fff',
        }}>
            <Drawer.Screen name='InventoryScreen' component={InventoryScreen} options={{
                drawerLabel: 'Inventory',
                headerTitle: 'Inventory',
            }} />
            <Drawer.Screen name='ShoppingList' component={ShoppingList} options={{
                drawerLabel: 'Shopping List',
                headerTitle: 'Shopping List',
            }} />
            <Drawer.Screen name='MyRefrigerators' component={MyRefrigeratorsScreen} options={{
                drawerLabel: 'My Refrigerators',
                headerTitle: 'My Refrigerators',
            }} />
            <Drawer.Screen name='Recipes' component={RecipesScreen} options={{
                drawerLabel: 'Recipes',
                headerTitle: 'Recipes',
            }} />
            <Drawer.Screen name='Consumption' component={ConsumptionScreen} options={{
                drawerLabel: 'Consumption Reports',
                headerTitle: 'Consumption Reports',
            }} />
            <Drawer.Screen name='Settings' component={SettingsScreen} options={{
                drawerLabel: 'Settings',
                headerTitle: 'Settings',
            }} />
        </Drawer.Navigator>
    )
}

export default DrawerNavigator