import React, { useState ,useEffect } from 'react';
import { View, StyleSheet, Text, ImageBackground, ActivityIndicator} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import CustomButton from '../components/CustomButton';


export default function CreateShoppingList({route}){
    const { fridgeId, selectedItem } = route.params;
    const navigation = useNavigation();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ShoppingList, setShoppingList] = useState([]);


    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await axios.get('http://10.0.0.8:12345/create_shopping_list',{
                params: { refrigerator_id:fridgeId },
            });
            setShoppingList(response.data); 
          } catch (error) {
            console.error('Error fetching search results:', error);
            setError('Failed to fetch search results. Please try again.');
          } finally {
            setLoading(false);
          }
        };
    
        fetchData();
    }, []); 

    useEffect(() => {
        if (route.params?.item) {
            const newItem = route.params.item;

            const itemExists = ShoppingList.some(item => item.barcode === newItem.barcode);
        
            if(!itemExists){
                setShoppingList((prevParameters) => [...prevParameters, {   
                        product_name:newItem.product_name,
                        barcode:newItem.barcode,
                        amount:1
                }]);
            }
            console.log(ShoppingList);
        }
    }, [route.params?.item]);
    
    if (loading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        );
    }

    
    const handleApplyChanges = async () =>{
        try{
            await axios.post('http://10.0.0.8:12345/update_refrigerator_parameters', ShoppingList,{
                params: {
                    refrigerator_id: fridgeId
                }
            });
            navigation.navigate('ShoppingList',{fridgeId:1})
        }catch(error){
          console.error('Error fetching search results:', error);
          setError('Failed to fetch search results. Please try again.');
        }
    }

    const handleDataChange= (newDataList)=> {
        setShoppingList(newDataList);
    }


    return (
        <ImageBackground
            source={require('../assets/images/background.jpg')}
            style={styles.imageBackground}
        >
            <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Shopping List Creation:</Text>
                <CustomList
                    initialData={ShoppingList}
                    onDataChange={handleDataChange}
                />
                <View style={styles.buttonContainer}>
                    <CustomButton title="Save" onPress={handleApplyChanges} />
                    <CustomButton
                        title="Search"
                        onPress={() => navigation.navigate('SearchProduct',{fridgeId:1 ,from:"CreateShoppingList"})} 
                    />
                </View>
            </View>
        </ImageBackground>
    );
      
};


const styles = StyleSheet.create({
    button:{
      marginTop: 20,
      marginBottom: 20,
    },
    list: {
      marginTop: 16,
    },
    flatList:{
      maxHeight: '50%',
    },
    item: {
      backgroundColor: '#f9c2ff',
      padding: 20,
      marginVertical: 8,
      borderRadius: 10,
    },
    error: {
      color: 'red',
      marginVertical: 8,
    },
    modalContainer: {
      flex: 1,
      borderRadius: 10,
      padding: 20,
      alignItems: 'flex-start',
      justifyContent: 'center',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
      color: '#fff',
    },
    listContent: {
      paddingBottom: 20,
    },
    itemContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: '#100000',
      padding: 10,
      marginVertical: 10,
      borderRadius: 10,
      width: '100%',
    },
    itemText: {
      fontSize: 16,
      color: '#fff',
      marginRight: 10,
    },
    imageBackground: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
    },
    plus: {
      fontWeight: 'bold',
      fontSize: 20,
      color:'#00FF00',
    },
    remove:{
      fontWeight: 'bold',
      fontSize: 20,
      color:'#FF0000',
    },
    parameterButton:{
      padding: 5, // Increase padding to make it more touchable
    },
    minusSign: {
      width: 20, // Adjust the width to make the minus sign longer
      height: 2, // Thickness of the minus sign
      backgroundColor: '#FF0000',
    },

    parameterItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      alignItems: 'center',
    },
    parameterItemContainer:{
      alignItems: 'center',
      justifyContent:'center',
      backgroundColor: '#100000',
      padding: 10,
      marginVertical: 10,
      borderRadius: 10,
      width: '100%',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        bottom: 0,
        width: '100%',
    },
});
