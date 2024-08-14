import React, { useState } from 'react';
import { Text, StyleSheet, TouchableOpacity, ActivityIndicator, View, FlatList, Alert } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import RecipeCard from '../components/RecipeCard';
import { getRecipes } from '../api/recipeApi';
import { getRefrigeratorContents } from '../api/refrigeratorApi';
import { useAuth } from '../contexts/AuthContext';
import NoFridge from '../components/NoFridge';




const RecipesScreen = () => {

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    //const [ingredients, setIngredients] = useState(null);
    const [isGenerated, setIsGenerated] = useState(false);
    const { fridgeId } = useAuth();

    const handleGeneratePress = async () => {
        console.log("clicked");
        console.log(fridgeId);
        if (fridgeId === null) {
            console.log("entered fridge is null");
            Alert.alert('Error', 'Please select a fridge first.');
            return;
        }
        setLoading(true);
        console.log(loading);

        try {
            const fetchedIngredients = await fetchIngredients();
            console.log('Fetched ingredients:', fetchedIngredients);

            if (fetchedIngredients && fetchedIngredients.length > 0) {
                await fetchData(fetchedIngredients);
                console.log("fetched data");
                setIsGenerated(true);
                console.log('Is Generated:', isGenerated);
            } else {
                console.log('No ingredients found');
                Alert.alert('Error', 'No ingredients found');
            }
        } catch (error) {
            console.error('Error during fetching:', error);
            Alert.alert('Error', 'Please try again.');
        } finally {
            setLoading(false);
            console.log('Loading:', loading);
        }


        // await fetchIngredients();
        // console.log(ingredients);
        // if (ingredients) {
        //     await fetchData();
        //     console.log("fetched data");
        //     setIsGenerated(true);
        //     console.log(isGenerated);
        // }
        // console.log("before end");
        // setLoading(false);
    };

    const handleClearPress = async () => {
        setData(null);
        //setIngredients(null);
        setIsGenerated(false);
    };


    const fetchIngredients = async () => {
        try {
            const response = await getRefrigeratorContents(fridgeId);

            const transformedItems = response.data.products.map(item => ({
                name: item.product_name,
            }));

            //setIngredients(transformedItems);
            return transformedItems
        } catch (error) {
            console.log('Error fetching data:', error);
            console.log(fridgeId);
            return null;
        }
    };

    const fetchData = async (ingredients) => {
        try {
            const response = await getRecipes(ingredients);

            if (response.status === 200)
                setData(response.data);
            else {
                Alert.alert('Daily limit reached', 'You have exceeded your daily allocated limit for generating recipes');
            }

        } catch (error) {
            console.log('Error fetching data:', error);
        }
    };


    const renderItem = ({ item }) => (
        <RecipeCard recipeId={item.id} imageUri={item.image} title={item.title} missedIngredients={item.missedIngredients} usedIngredients={item.usedIngredients} />
    );

    return (
        <ScreenLayout>
            {fridgeId && !loading && !isGenerated && (
                <TouchableOpacity style={styles.generateButton} onPress={handleGeneratePress}  >
                    <Text style={styles.generateText}>Generate Recipes</Text>
                </TouchableOpacity>
            )}
            {fridgeId && loading && (
                <ActivityIndicator size="large" color="#fff" />
            )}
            {fridgeId && !loading && data && data.length > 0 && (
                <View style={styles.container}>
                    <FlatList
                        data={data}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.contentContainer}
                    />
                </View>
            )}
            {((fridgeId && !loading && data && data.length === 0) || (fridgeId && !data && !loading)) && (
                <View style={styles.container}>
                    <Text style={styles.defaultText}>No Recipes</Text>
                </View>

            )}
            {fridgeId && !loading && isGenerated && (
                <TouchableOpacity style={styles.clearButton} onPress={handleClearPress} >
                    <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
            )}
            {!fridgeId && (
                <NoFridge></NoFridge>
            )}
        </ScreenLayout>
    );
};


export default RecipesScreen;


const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    generateButton: {
        backgroundColor: '#c6cbef',
        paddingVertical: 12,
        width: '100%',
        alignItems: 'center',
    },
    generateText: {
        color: '#465881',
        fontSize: 18,
        fontWeight: 'bold',
    },
    clearButton: {
        backgroundColor: '#C75B7A',
        paddingVertical: 12,
        width: '100%',
        alignItems: 'center',
        marginTop: 10
    },
    clearText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    defaultText: {
        color: '#ededed',
    },
    contentContainer: {
        width: '85%',
    },
});