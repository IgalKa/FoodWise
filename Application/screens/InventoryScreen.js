import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Image, TextInput, ImageBackground, BackHandler, ActivityIndicator } from 'react-native';
import { useDoubleBackPressExit } from '../hooks/DoubleBackExit';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

const DATA = [
    { id: '1', name: 'Itemm 1', quantity: 10, image: require('../assets/milk.jpg') },
    { id: '2', name: 'Itemm 2', quantity: 15, image: require('../assets/milk.jpg') },
    { id: '3', name: 'Item 3', quantity: 20, image: require('../assets/milk.jpg') },
    { id: '4', name: 'Item 4', quantity: 8, image: require('../assets/milk.jpg') },
    { id: '5', name: 'Item 5', quantity: 12, image: require('../assets/milk.jpg') },
    { id: '6', name: 'Item 6', quantity: 5, image: require('../assets/milk.jpg') },
    { id: '7', name: 'Item 6', quantity: 5, image: require('../assets/milk.jpg') },
    { id: '8', name: 'Item 6', quantity: 5, image: require('../assets/milk.jpg') },
    { id: '9', name: 'Item 6', quantity: 5, image: require('../assets/milk.jpg') },
    { id: '10', name: 'Item 6', quantity: 5, image: require('../assets/milk.jpg') },
    { id: '11', name: 'Item 6', quantity: 5, image: require('../assets/milk.jpg') },
    { id: '12', name: 'Item 6', quantity: 5, image: require('../assets/milk.jpg') },
    { id: '13', name: 'Item 6', quantity: 5, image: require('../assets/milk.jpg') },
    { id: '14', name: 'Item 6', quantity: 5, image: require('../assets/milk.jpg') },
    { id: '15', name: 'Item 6', quantity: 5, image: require('../assets/milk.jpg') },

];

function InventoryScreen({ navigation }) {

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [data, setData] = useState(null);
    const [filteredData, setFilteredData] = useState(data);
    const [loading, setLoading] = useState(true);



    const fetchData = async () => {
        try {
            const response = await axios.get('http://10.100.102.7:12345/refrigerator_contents', {
                params: {
                    refrigerator_id: 1
                },
                timeout: 10000,
            });

            const transformedItems = response.data.products.map(item => ({
                name: item.product_name,
                quantity: item.product_quantity,
                image: `data:image/png;base64,${item.product_image}`,
                date: item.product_addedTime,
            }));

            setData(transformedItems);
        } catch (error) {
            console.log('Error fetching data:', error);
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch data initially
        fetchData();
        // Set up interval for periodic polling
        const intervalId = setInterval(fetchData, 15000); // Fetch data every 5 seconds (adjust as needed)
        // Clean up interval on component unmount
        return () => clearInterval(intervalId);
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            setLoading(true);
            fetchData();
        }, [])
    );






    useEffect(() => {
        if (searchQuery) {
            setIsSearching(true);
            const filteredItems = data.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredData(filteredItems);
        } else {
            setIsSearching(false);
            setFilteredData(data);
        }
    }, [searchQuery]);


    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.item}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.quantity}>Quantity: {item.quantity}</Text>
        </TouchableOpacity>
    );

    useDoubleBackPressExit(() => {
        BackHandler.exitApp();
    });



    return (
        <ImageBackground
            source={require('../assets/images/background.jpg')} // Adjust the path to your background image
            style={styles.background}
        >
            {/* <View style={styles.logoContainer}>
                <Text style={styles.logo}>FoodWise</Text>
            </View> */}

            <View style={styles.container}>
                {!loading && (
                    <View style={styles.searchContainer}>
                        <Image source={require('../assets/search.jpg')} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by item name"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                )}
                {loading && (
                    <ActivityIndicator size="large" color="#fff" />
                )}
                {!loading && (
                    <FlatList
                        data={isSearching ? filteredData : data}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        numColumns={2}
                    />
                )}
            </View>
        </ImageBackground>
    );
}

export default InventoryScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        fontWeight: 'bold',
        fontSize: 30,
        color: '#fff',
        paddingLeft: 15,
        marginTop: 15,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#fff',
        borderWidth: 0.5,
        borderRadius: 10,
        paddingHorizontal: 16,
        marginBottom: 20,
        width: '90%',
        marginTop: 30,
    },
    searchIcon: {
        width: 24,
        height: 24,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        color: 'white',
    },
    title: {
        fontWeight: "bold",
        fontSize: 40,
        color: "#fff",
        marginBottom: 40,
        marginTop: 10,
    },
    item: {
        backgroundColor: '#465881',
        padding: 20,
        marginVertical: 8,
        marginHorizontal: 8,
        borderRadius: 10,
        width: 150, // Adjust width as needed for grid layout
        alignItems: 'center',
    },
    image: {
        width: 80,
        height: 80,
        marginBottom: 10,
    },
    name: {
        fontSize: 16,
        color: 'white',
    },
    quantity: {
        fontSize: 14,
        color: 'white',
    },
    button: {
        fontSize: 16,
        color: 'white',
        marginBottom: 10,
    },
    background: {
        flex: 1,
        resizeMode: 'cover', // or 'stretch' or 'contain'
    },
});