import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet, Text, FlatList, Image, ImageBackground } from 'react-native';
import apiClient from '../api/apiClient';
import { useAuth } from '../contexts/AuthContext';
import NoFridge from '../components/NoFridge';
import Loading from '../components/Loading';
import ScreenLayout from '../components/ScreenLayout';


export default function NotificationsScreen() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { fridgeId } = useAuth();

    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                if (!fridgeId) {
                    return;
                }
                try {
                    console.log('Fetching data from:', '/get_refrigerator_content_expired');
                    const response = await apiClient.get('/get_refrigerator_content_expired', {
                        params: { refrigerator_id: fridgeId },
                    });
                    console.log('Got a response');
                    console.log(response.data.products.length);
                    const transformedItems = response.data.products.map(item => ({
                        name: item.product_name,
                        quantity: item.product_quantity,
                        image: `data:image/png;base64,${item.product_image}`,
                        date: item.product_alert_date,
                    }));
                    setAlerts(transformedItems);
                } catch (error) {
                    console.error('Error details:', error.response || error.message || error);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }, [fridgeId]) // Re-run effect if fridgeId changes
    );

    const renderItem = ({ item }) => (
        <View style={styles.itemContainer}>
            <View style={styles.textContainer}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.date}>Passed: {item.date}</Text>
            </View>
            <Image source={{ uri: item.image }} style={styles.image} />
        </View>
    );




    return (
        // <ImageBackground
        //     source={require('../assets/images/background.jpg')}
        //     style={styles.background}
        // >
        <ScreenLayout>
            <View style={styles.container}>
                {!loading && fridgeId && alerts && alerts.length > 0 &&
                    <FlatList
                        data={alerts}
                        renderItem={renderItem}
                        keyExtractor={item => item.name}
                    />
                }


                {!loading && alerts && alerts.length === 0 && fridgeId && (
                    <View style={styles.centeredContainer}>
                        <Text style={styles.defaultText}>No alerts</Text>
                    </View>
                )}



                {loading && fridgeId && <Loading />}

                {!fridgeId && <NoFridge />}
            </View>
        </ScreenLayout >
        // {/* </ImageBackground > */ }
    );
}

const styles = StyleSheet.create({
    itemContainer: {
        flexDirection: 'row',
        backgroundColor: '#08062e',
        padding: 10,
        marginVertical: 10,
        borderRadius: 10,
        width: '95%',
        alignSelf: "center",
    },
    textContainer: {
        flex: 1, // Take up available space
        flexDirection: 'column', // Vertical layout for texts
        marginRight: 10, // Space between text and image
    },
    date: {
        fontSize: 16,
        color: '#fff',
    },
    name: {
        fontSize: 18,
        color: '#fff',
        marginBottom: 30,
    },
    image: {
        justifyContent: 'center',
        width: 80,
        height: 80,
    },
    background: {
        flex: 1,
        resizeMode: 'cover',
    },
    container: {
        flex: 1,
        flexDirection: "row",
    },
    defaultText: {
        color: '#ededed',
    },
    centeredContainer: {
        alignContent: "center",
        justifyContent: "center",
    }
})


