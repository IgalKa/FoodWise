import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, Text, View, TouchableOpacity, FlatList, Image, TextInput,
    ActivityIndicator, Modal
} from 'react-native';
import { Button } from '@rneui/themed';
import { useFocusEffect } from '@react-navigation/native';
import ScreenLayout from '../components/ScreenLayout';
import { getRefrigeratorContents, getAlertDate, updateAlertDate } from '../api/refrigeratorApi';
import { useAuth } from '../contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import Counter from '../components/Counter';


function InventoryScreen({ navigation }) {

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [data, setData] = useState(null);
    const [filteredData, setFilteredData] = useState(data);
    const [loading, setLoading] = useState(true);
    const { fridgeId } = useAuth();
    const [isModalVisible, setModalVisible] = useState(false);
    const [alertDate, setAlertDate] = useState('');
    const [productName, setProductName] = useState(null);
    const [date, setDate] = useState(new Date());
    const [show, setShow] = useState(false);
    const [quantity, setQuantity] = useState(null);


    const fetchData = async () => {
        try {
            const response = await getRefrigeratorContents(fridgeId);

            const transformedItems = response.data.products.map(item => ({
                name: item.product_name,
                quantity: item.product_quantity,
                image: `data:image/png;base64,${item.product_image}`,
                alert: item.product_alert_date,
            }));

            setData(transformedItems);

        } catch (error) {
            console.log('Error fetching data:', error);
            console.log(fridgeId);
        }
        finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            // Fetch data initially when the screen is focused
            fetchData();
            // Set up interval for periodic polling
            const intervalId = setInterval(fetchData, 15000);
            // Clean up interval when the screen goes out of focus
            return () => clearInterval(intervalId);
        }, [fridgeId])
    );

    useFocusEffect(
        React.useCallback(() => {
            setLoading(true);
        }, [])
    );




    useEffect(() => {
        if (searchQuery) {
            setIsSearching(true);
            if (data) {
                const filteredItems = data.filter(item =>
                    item.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
                setFilteredData(filteredItems);
            }
        } else {
            setIsSearching(false);
            setFilteredData(data);
        }
    }, [searchQuery]);

    const handleLongPress = async (item) => {
        try {
            const response = await getAlertDate(fridgeId, item.name);
            if (response.status === 200) {
                console.log(response.data.alert_date);
                console.log("***************************");
                const dateString = response.data.alert_date;
                setQuantity(item.quantity);
                setAlertDate(dateString);
                setProductName(item.name);
                setModalVisible(true);
                dateString ? setDate(new Date(dateString)) : setDate(new Date());
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSaveAlertDate = async () => {
        try {
            setModalVisible(false);
            await updateAlertDate(fridgeId, productName, alertDate);
            fetchData();
        } catch (error) {
            console.log(error);
            if (error.response.status = 400) {
                console.error("please choose a date in the future.");
            }
        }
    };

    const handleSaveQuantity = async () => {
        try {
            setModalVisible(false);
            //await updateAlertDate(fridgeId, productName, alertDate);
            fetchData();
        } catch (error) {
            console.log(error);
            if (error.response.status = 400) {
                console.error("error saving quantity.");
            }
        }
    };

    const onChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShow(false);
        setDate(currentDate);

        // Format the date as needed (e.g., "YYYY-MM-DD")
        const dateString = currentDate.toISOString().split('T')[0];
        setAlertDate(dateString);
    };



    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.item}
            onLongPress={() => handleLongPress(item)}
            activeOpacity={0.8}
        >
            <Image source={{ uri: item.image }} style={styles.image} />
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.quantity}>Quantity: {item.quantity}</Text>
            {item.alert !== null && (
                <Text style={styles.quantity}>Alert: {item.alert}</Text>
            )}
        </TouchableOpacity>
    );



    return (
        <ScreenLayout>
            {!loading && data && data.length > 0 && fridgeId && (
                <View style={styles.searchContainer}>
                    <Image source={require('../assets/search.png')} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by item name"
                        placeholderTextColor={'#ededed'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            )}
            {loading && fridgeId && (
                <ActivityIndicator size="large" color="#fff" />
            )}
            {!loading && data && data.length > 0 && fridgeId && (
                <FlatList
                    data={isSearching ? filteredData : data}
                    renderItem={renderItem}
                    keyExtractor={item => item.name}
                    numColumns={2}
                />
            )}
            {!loading && data && data.length === 0 && fridgeId && (
                <Text style={styles.defaultText}>No products</Text>
            )}
            {!fridgeId && (
                <TouchableOpacity style={styles.selectButton} onPress={() => { navigation.navigate('MyRefrigerators'); }} >
                    <Text style={styles.buttonText}>Select A Refrigerator</Text>
                </TouchableOpacity>
            )}

            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalProduct}>{productName}</Text>
                        <Text style={styles.modalTitle}>Set alert date </Text>

                        <TouchableOpacity onPress={() => setShow(true)}>
                            <Text style={styles.dateText}>
                                {alertDate ? alertDate : 'Select a date'}
                            </Text>
                        </TouchableOpacity>

                        {show && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display="default"
                                onChange={onChange}
                                minimumDate={new Date(new Date().setDate(new Date().getDate() + 1))}
                            />
                        )}

                        <View style={styles.buttonContainer}>
                            <View style={styles.renameButton}>
                                <Button color="#465881" title="Save" onPress={handleSaveAlertDate} disabled={alertDate === null} />
                            </View>
                        </View>

                        <Text style={styles.modalTitle}>Edit quantity </Text>
                        <View style={styles.buttonContainer}>
                            <Counter initialValue={quantity} />
                        </View>

                        <View style={styles.buttonContainer}>
                            <View style={styles.renameButton}>
                                <Button color="#465881" title="Save" onPress={handleSaveAlertDate} />
                            </View>
                        </View>

                        <View style={styles.buttonContainer}>
                            <View style={styles.cancelButton}>
                                <Button color="warning" title="Cancel" onPress={() => setModalVisible(false)} />
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

        </ScreenLayout>
    );
}

export default InventoryScreen;

const styles = StyleSheet.create({
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
        width: 150,
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
    selectButton: {
        backgroundColor: '#cd87ff',
        paddingVertical: 12,
        borderRadius: 5,
        width: '80%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    defaultText: {
        color: '#ededed',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '80%',
        padding: 20,
        backgroundColor: '#c6cbef',
        borderRadius: 10,
    },
    modalTitle: {
        color: '#465881',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    input: {
        height: 40,
        borderColor: '#465881',
        borderWidth: 2,
        marginBottom: 10,
        paddingHorizontal: 10,
        color: '#465881',
    },
    buttonContainer: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    renameButton: {
        width: '80%',
    },
    cancelButton: {
        paddingTop: 20,
        width: '50%',
    },
    dateText: {
        width: '100%', // Make it span the entire width of the modal
        height: 50,
        borderColor: 'black',
        borderWidth: 2,
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 50,
        borderRadius: 10,
        fontWeight: "bold",
        fontSize: 15,
    },
    modalProduct: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        alignSelf: "center",
    },
});