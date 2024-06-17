import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { View, FlatList, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Modal, TextInput } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { useAuth } from '../contexts/AuthContext';
import QRCode from 'react-native-qrcode-svg';
import axios from 'axios';
import CONFIG from '../config';
import { getLinkedRefrigerators, updateRefrigeratorName } from '../api/refrigeratorApi';

const ItemSelectionScreen = () => {
    const [selectedItem, setSelectedItem] = useState(null);
    const { fridgeId, setFridgeId, userId } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setModalVisible] = useState(false);
    const [isLinkModalVisible, setLinkModalVisible] = useState(false);
    const [newName, setNewName] = useState('');
    const [renameId, setRenameId] = useState(null);
    const navigation = useNavigation();


    const fetchData = async () => {
        try {
            // const response = await axios.get(`${CONFIG.SERVER_URL}/linked_refrigerators`, {
            //     params: {
            //         user_id: userId,
            //     },
            //     timeout: 30000,
            // });
            const response = await getLinkedRefrigerators(userId);

            const transformedItems = response.data.refrigerators.map(item => ({
                id: item.refrigerator_id.toString(),
                name: item.nickname,
            }));

            if (response.status === 200)
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
            fetchData();
        }, [])
    );

    useFocusEffect(
        React.useCallback(() => {
            setLoading(true);
        }, [])
    );

    useEffect(() => {
        setSelectedItem(fridgeId);
    }, [fridgeId]);

    const handleItemPress = (item) => {
        const newSelectedItem = item.id === selectedItem ? null : item.id;
        setSelectedItem(newSelectedItem);
        if (newSelectedItem) {
            console.log(newSelectedItem);
            setFridgeId(newSelectedItem.toString());
            setTimeout(() => {
                navigation.navigate('InventoryScreen');
            }, 250);
        }
        else
            setFridgeId(newSelectedItem);
    };

    const handleLongPress = (item) => {
        setNewName(item.name);
        setRenameId(item.id);
        setModalVisible(true);
    };

    const handleLinkPress = (item) => {
        setLinkModalVisible(true);
    };

    const handelLinkCancel = () => {
        setLinkModalVisible(false);
        fetchData();
    }

    const handleRename = async () => {
        setModalVisible(false);
        setLoading(true);
        try {
            // const response = await axios.post(`${CONFIG.SERVER_URL}/update_refrigerator_name`, {
            //     new_name: newName,
            //     refrigerator_id: renameId,
            // }, {
            //     params: {
            //         user_id: userId,
            //     },
            //     timeout: 30000,
            // });
            const response = await updateRefrigeratorName(newName, renameId, userId);

        } catch (error) {
            //console.log('Error updating data:', error);
            console.log(error.response.data.error);
        }
        fetchData();
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.item, selectedItem === item.id && styles.selectedItem]}
            onPress={() => handleItemPress(item)}
            onLongPress={() => handleLongPress(item)}
        >
            <Text style={styles.itemText}>{item.name}</Text>
            <View style={[styles.radioButton, selectedItem === item.id && styles.selectedRadioButton]} />
        </TouchableOpacity>
    );

    return (
        <ScreenLayout>
            {!loading && (
                <TouchableOpacity style={styles.syncButton} onPress={handleLinkPress} >
                    <Text style={styles.syncText}>Link A New Refrigerator</Text>
                </TouchableOpacity>
            )}
            {loading && (
                <ActivityIndicator size="large" color="#fff" />
            )}
            {!loading && data && (
                <View style={styles.container}>
                    {data && data.length > 0 && (
                        <Text style={styles.selectTitle}>Select A Refrigerator:</Text>
                    )}
                    <FlatList
                        data={data}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContainer}
                    />
                </View>
            )}
            {!loading && data && data.length === 0 && (
                <View style={styles.container}>
                    <Text>No Refrigerators</Text>
                </View>

            )}



            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Rename Refrigerator</Text>
                        <TextInput
                            style={styles.input}
                            value={newName}
                            onChangeText={setNewName}
                        />
                        <View style={styles.buttonContainer}>
                            <View style={styles.renameButton}>
                                <Button color="#465881" title="Rename" onPress={handleRename} />
                            </View>
                            <View style={styles.cancelButton}>
                                <Button color="warning" title="Cancel" onPress={() => setModalVisible(false)} />
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={isLinkModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={handelLinkCancel}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent2}>
                        <Text style={styles.modalTitle}>Scan the QR code with your FoodWise device to make a link</Text>
                        <QRCode
                            value={userId}
                            size={200}
                            style={styles.qr}
                        />
                        <View style={styles.cancelButton2}>
                            <Button color="warning" title="Cancel" onPress={handelLinkCancel} />
                        </View>
                    </View>
                </View>
            </Modal>

        </ScreenLayout>
    );
};

export default ItemSelectionScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
        alignItems: 'center',
    },
    listContainer: {
        paddingTop: 20,
        justifyContent: 'center',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        marginVertical: 8,
        marginHorizontal: 16,
        backgroundColor: '#465881',
        borderRadius: 10,
        width: '90%',
    },
    selectedItem: {
        borderWidth: 2,
        borderColor: '#fff',
    },
    itemText: {
        fontSize: 16,
        color: '#fff',
        marginRight: 10,
    },
    radioButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#fff',
        backgroundColor: '#465881',
    },
    selectedRadioButton: {
        backgroundColor: '#fff',
    },
    syncButton: {
        backgroundColor: '#c6cbef',
        paddingVertical: 12,
        width: '100%',
        alignItems: 'center',
    },
    syncText: {
        color: '#465881',
        fontSize: 18,
        fontWeight: 'bold',
    },
    selectTitle: {
        fontSize: 18,
        fontWeight: 'bold',
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
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start'
    },
    renameButton: {
        width: '50%',
        paddingRight: 2.5,
    },
    cancelButton: {
        width: '50%',
        paddingLeft: 2.5,
    },
    cancelButton2: {
        width: '80%',
        paddingTop: 10,
        alignSelf: 'center',
    },
    modalContent2: {
        width: '80%',
        padding: 20,
        backgroundColor: '#c6cbef',
        borderRadius: 10,
        alignItems: 'center',
    },
});