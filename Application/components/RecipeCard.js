import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Text, Image, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Card, Title, Button, Paragraph } from 'react-native-paper';
import { getInstructions } from '../api/recipeApi';

const RecipeCard = ({ recipeId, imageUri, title, missedIngredients, usedIngredients }) => {

    const [modalVisible, setModalVisible] = useState(false);
    const [instructions, setInstructions] = useState([]);
    const [loading, setLoading] = useState(true);

    const handlePress = () => {
        setLoading(true);
        fetchInstructions(recipeId);
        setModalVisible(true);
    };

    const handelLinkCancel = () => {
        setModalVisible(false);
        setInstructions([]);
    }

    const fetchInstructions = async (recipeId) => {
        try {
            const response = await getInstructions(recipeId);
            if (response.status === 200) {
                setInstructions(response.data);
                console.log(response);
            }
        } catch (error) {
            console.log('Error fetching data:', error);
        }
        finally {
            setLoading(false);
        }
    };

    const renderStep = ({ item }) => (
        <View style={styles.stepCard}>
            <Text style={styles.stepNumber}>Step {item.number}</Text>
            <Text style={styles.stepInstruction}>{item.step}</Text>
        </View>
    );

    const renderIngredient = ({ item }) => (
        <View style={styles.ingredientContainer}>
            <Image source={{ uri: item.image }} style={styles.ingredientImage} />
            <View style={styles.ingredientInfo}>
                <Text style={styles.ingredientName}>{item.name}</Text>
                <Text style={styles.ingredientAmount}>{item.amount} {item.unitShort}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Card style={styles.card}>
                <Card.Cover source={{ uri: imageUri }} style={styles.cover} />
                <Card.Content>
                    <Title style={styles.text}>{title}</Title>
                </Card.Content>
                <Card.Actions style={styles.action}>
                    <Button mode="elevated" style={styles.button} onPress={handlePress}>
                        Show Full Recipe
                    </Button>
                </Card.Actions>
            </Card>

            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={handelLinkCancel}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIngredients}>
                            <Text style={styles.modalTitle}>{title}</Text>
                            <Text style={styles.modalSubtitle}>Ingredients You Have:</Text>
                            {usedIngredients.length > 0 && (<FlatList
                                data={usedIngredients}
                                renderItem={renderIngredient}
                                keyExtractor={item => item.id.toString()}
                            />)}
                            {usedIngredients.length === 0 && (
                                <Text style={styles.modalSubtitle}>No Ingredients</Text>
                            )}
                            <Text style={styles.modalSubtitle}>Missing Ingredients:</Text>
                            {missedIngredients.length > 0 && (<FlatList
                                data={missedIngredients}
                                renderItem={renderIngredient}
                                keyExtractor={item => item.id.toString()}
                            />)}
                            {missedIngredients.length === 0 && (
                                <Text style={styles.modalSubtitle}>No Missing Ingredients</Text>
                            )}
                        </View>
                        <View style={styles.modalInstructions}>
                            <Text style={styles.modalSubtitle}>Instructions</Text>
                            {loading && (
                                <ActivityIndicator size="large" color="#fff" />
                            )}
                            {!loading && (<FlatList
                                data={instructions.length > 0 ? instructions[0].steps : []}
                                renderItem={renderStep}
                                keyExtractor={(item) => item.number.toString()}
                                style={styles.instructionList}
                            />)}
                        </View>
                        <View style={styles.cancelButton}>
                            <Button mode="contained" onPress={handelLinkCancel} >
                                Cancel
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignSelf: 'center',
        marginVertical: 7.5,
    },
    card: {
        width: '100%',
        backgroundColor: '#c6cbef',
    },
    cover: {
        resizeMode: 'cover',
        padding: 5,
    },
    text: {
        color: '#465881',
        fontSize: 18,
        fontWeight: 'bold',
        alignSelf: "center",
    },
    action: {
        alignSelf: "center",
        padding: 10,
    },
    button: {
        width: "90%",
        alignSelf: "center",
    },
    ingredientContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
    },
    ingredientImage: {
        width: 50,
        height: 50,
        marginRight: 10,
    },
    ingredientInfo: {
        flex: 1,
    },
    ingredientName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    ingredientAmount: {
        fontSize: 14,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalTitle: {
        color: '#465881',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    cancelButton: {
        width: '80%',
        paddingTop: 10,
        alignSelf: 'center',
        flex: 0.15,
        marginTop: 'auto',
    },
    modalContent: {
        width: '90%',
        padding: 20,
        backgroundColor: '#c6cbef',
        borderRadius: 10,
        alignItems: 'center',
        flex: 0.975,
    },
    modalIngredients: {
        flex: 0.7,
        flexShrink: 1,
        minHeight: 150,
    },
    modalInstructions: {
        flex: 0.2,
        flexGrow: 1,

    },
    modalSubtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10,
        alignSelf: "center"
    },
    flatListContent: {
        paddingVertical: 5,
    },
    instructionLine: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 3,
    },
    instructionList: {
        marginTop: 20,
        width: '100%',
    },
    stepCard: {
        padding: 10,
        backgroundColor: '#BEADFA',
        borderRadius: 5,
        marginVertical: 5,
        alignItems: 'flex-start',
    },
    stepNumber: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    stepInstruction: {
        fontSize: 14,
    },
});

export default RecipeCard;