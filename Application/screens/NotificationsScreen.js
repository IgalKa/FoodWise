import React, { useState, useEffect } from 'react';
import {
    View, TextInput, StyleSheet, Text, FlatList,
    TouchableOpacity, Alert, Image, ImageBackground, ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/apiClient';
import ScreenLayout from "../components/ScreenLayout";
import { useAuth } from '../contexts/AuthContext';
import NoFridge from '../components/NoFridge';


export default function NotificationsScreen() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { fridgeId } = useAuth();

    useEffect(() => {
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

        const intervalId = setInterval(() => {
            fetchData();
        }, 15000);

        return () => clearInterval(intervalId); // Cleanup on component unmount
    }, [fridgeId]);

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
                    <Text style={styles.defaultText}>No alerts</Text>
                )}



                {loading && fridgeId && <ActivityIndicator size="large" color="#fff" />}

                {!fridgeId && <NoFridge />}
            </View>
        </ScreenLayout >
        // {/* </ImageBackground > */ }
    );
}

const styles = StyleSheet.create({
    itemContainer: {
        flexDirection: 'row',
        backgroundColor: '#100000',
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
})


