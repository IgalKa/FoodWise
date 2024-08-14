import 'react-native-gesture-handler';
import * as React from 'react';
import { Image, StyleSheet } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import InventoryScreen from '../screens/InventoryScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import MyRefrigeratorsScreen from '../screens/MyRefrigeratorsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ShoppingList from '../screens/ShoppingList';
import RecipesScreen from '../screens/RecipesScreen';
import ConsumptionScreen from '../screens/ConsumptionScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import CartIcon from '../assets/images/cart.png';
import ChartIcon from '../assets/images/chart.png';
import ChefIcon from '../assets/images/chef-hat.png';
import DangerIcon from '../assets/images/danger-triangle.png';
import FridgeIcon from '../assets/images/fridge.png';
import LinkIcon from '../assets/images/link.png';
import SettingsIcon from '../assets/images/setting-d.png';



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
                drawerIcon: () => (
                    <Image
                        source={FridgeIcon}
                        style={styles.icon}
                    />
                ),
            }} />
            <Drawer.Screen name='ShoppingList' component={ShoppingList} options={{
                drawerLabel: 'Shopping List',
                headerTitle: 'Shopping List',
                drawerIcon: () => (
                    <Image
                        source={CartIcon}
                        style={styles.icon}
                    />
                ),
            }} />
            <Drawer.Screen name='MyRefrigerators' component={MyRefrigeratorsScreen} options={{
                drawerLabel: 'My Refrigerators',
                headerTitle: 'My Refrigerators',
                drawerIcon: () => (
                    <Image
                        source={LinkIcon}
                        style={styles.icon}
                    />
                ),
            }} />
            <Drawer.Screen name='Recipes' component={RecipesScreen} options={{
                drawerLabel: 'Recipes',
                headerTitle: 'Recipes',
                drawerIcon: () => (
                    <Image
                        source={ChefIcon}
                        style={styles.icon}
                    />
                ),
            }} />
            <Drawer.Screen name='Consumption' component={ConsumptionScreen} options={{
                drawerLabel: 'Consumption Reports',
                headerTitle: 'Consumption Reports',
                drawerIcon: () => (
                    <Image
                        source={ChartIcon}
                        style={styles.icon}
                    />
                ),
            }} />
            <Drawer.Screen name=' Alerts' component={NotificationsScreen} options={{
                drawerLabel: 'Alerts',
                headerTitle: 'Alerts',
                drawerIcon: () => (
                    <Image
                        source={DangerIcon}
                        style={styles.icon}
                    />
                ),
            }} />
            <Drawer.Screen name='Settings' component={SettingsScreen} options={{
                drawerLabel: 'Settings',
                headerTitle: 'Settings',
                drawerIcon: () => (
                    <Image
                        source={SettingsIcon}
                        style={styles.icon}
                    />
                ),
            }} />
        </Drawer.Navigator>
    )
}

const styles = StyleSheet.create({
    icon: {
        width: 25,
        height: 25,
        margin: 0,    // Remove any margin
        padding: 0,
        marginRight: -25   // Remove any padding
    },
});

export default DrawerNavigator