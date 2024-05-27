import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Text, Button, StyleSheet } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { useAuth } from '../contexts/AuthContext';

const ItemSelectionScreen = () => {
    const [selectedItem, setSelectedItem] = useState(null);
    const { fridgeId, setFridgeId } = useAuth();
    const data = [
        { id: '1', name: 'Refrigerator 1' },
        { id: '2', name: 'Refrigerator 2' },
        { id: '3', name: 'Refrigerator 3' },
    ];

    useEffect(() => {
        setSelectedItem(fridgeId); // Initialize selected item from context
    }, [fridgeId]);

    const handleItemPress = (item) => {
        const newSelectedItem = item.id === selectedItem ? null : item.id;
        setSelectedItem(newSelectedItem);
        setFridgeId(newSelectedItem); // Save the selected fridge ID in context and async storage
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.item, selectedItem === item.id && styles.selectedItem]}
            onPress={() => handleItemPress(item)}
        >
            <Text style={styles.itemText}>{item.name}</Text>
            <View style={[styles.radioButton, selectedItem === item.id && styles.selectedRadioButton]} />
        </TouchableOpacity>
    );

    return (
        <ScreenLayout>
            <TouchableOpacity style={styles.syncButton} onPress={() => { /* Handle button press */ }} >
                <Text style={styles.syncText}>Link A New Refrigerator</Text>
            </TouchableOpacity>
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
        justifyContent: 'space-between', // Align text and radio button
        padding: 15,
        marginVertical: 8,
        marginHorizontal: 16,
        backgroundColor: '#465881',
        borderRadius: 10,
        width: '90%', // Take 90% of available horizontal space
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
    }
});