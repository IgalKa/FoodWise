import React, { useState } from 'react';
import {
    View, TextInput, StyleSheet, Text, FlatList,
    TouchableOpacity, Alert, Image, ImageBackground, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/apiClient';
import { addProduct } from '../api/refrigeratorApi';


export default function SearchProduct({ route }) {
    const { fridgeId, action } = route.params;
    const navigation = useNavigation();

    const [productName, setProductName] = useState('');
    const [results, setResults] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        try {
            setError(null); // Clear previous errors
            setLoading(true);
            const response = await apiClient.get('/search_products', {
                params: {
                    product_name: productName,
                    all: action,
                },
            });
            setResults(response.data);
        } catch (error) {
            if (error.response !== undefined && error.response.status === 404) {
                setResults([]);
            } else {
                console.error('Error fetching search results:', error);
                setError('An error occurred while fetching search results.');
            }
        }
        finally {
            setLoading(false);
        }
    };

    const handleItemPress = (item) => {
        if (selectedItem && selectedItem.barcode === item.barcode) {
            setSelectedItem(null); // Deselect if the same item is pressed again
        } else {
            setSelectedItem(item);
        }
    };

    const addNewProduct = async (barcode) => {
        try {
            const response = await addProduct(barcode, fridgeId);

            if (response.status === 200) {
                console.log("added item succesfully");
                setLoading(false);
                navigation.navigate('Inventory', { fridgeId: fridgeId, item: selectedItem });
            }

        } catch (error) {
            console.log('Error adding product:', error);
            console.log(fridgeId);
        }
        finally {
            setLoading(false);
        }
    };

    const handleSendSelected = (item) => {
        if (selectedItem) {
            if (action === 1)
                navigation.navigate('EditList', { fridgeId: fridgeId, item: selectedItem });
            else {
                console.log(selectedItem.barcode);
                setLoading(true);
                addNewProduct(selectedItem.barcode)
                navigation.navigate('Inventory', { fridgeId: fridgeId, item: selectedItem });
            }
        } else {
            Alert.alert('Error', 'No item selected.');
        }
    };


    const renderSearchItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.itemContainer, selectedItem && selectedItem.barcode === item.barcode && styles.selectedItem]}
            onPress={() => handleItemPress(item)}
        >
            <Text style={styles.itemText}>{item.product_name}</Text>
        </TouchableOpacity>
    );


    return (
        <ImageBackground
            source={require('../assets/images/background.jpg')}
            style={styles.imageBackground}
        >
            <View style={styles.searchContainer}>
                <Image source={require('../assets/search.png')} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by item name"
                    placeholderTextColor={'#ededed'}
                    value={productName}
                    onChangeText={setProductName}
                    onSubmitEditing={handleSearch}
                    returnKeyType="Search" // Customize the return key on the keyboard
                />
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
            {loading && (<ActivityIndicator color="#fff" />)}

            <FlatList
                style={styles.flatList}
                data={results}
                keyExtractor={(item) => item.barcode.toString()}
                renderItem={renderSearchItem}
                contentContainerStyle={styles.list}
            />

            {selectedItem && (
                <TouchableOpacity style={styles.addButton} onPress={handleSendSelected} disabled={loading}>
                    {!loading && (<Text style={styles.buttonText}> Add </Text>)}
                    {loading && (<ActivityIndicator color="#fff" />)}
                </TouchableOpacity>

            )}
        </ImageBackground>
    );
};


const styles = StyleSheet.create({
    buttonText: {
        color: '#201d59',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    itemContainer: {
        backgroundColor: '#08062e',
        padding: 10,
        marginVertical: 10,
        borderRadius: 10,
        width: '100%',
        elevation: 5,
    },
    itemText: {
        fontSize: 16,
        color: '#fff',
        marginRight: 10,
    },
    imageBackground: {
        width: '100%',
        height: '100%',
        alignItems: "center",
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
    list: {
        marginTop: 16,
    },
    flatList: {
        maxHeight: '65%',
        width: "90%"
    },
    item: {
        backgroundColor: '#f9c2ff',
        padding: 20,
        marginVertical: 8,
        borderRadius: 10,

    },
    selectedItem: {
        backgroundColor: '#90ee90',
    },
    error: {
        color: 'red',
        marginVertical: 8,
    },
    button: {
        marginTop: 20,
        marginBottom: 20,
    },
    addButton: {
        position: 'absolute',
        left: 16,
        bottom: 16,
        backgroundColor: '#f2dbff',
        padding: 16,
        borderRadius: 50,
    },
});
