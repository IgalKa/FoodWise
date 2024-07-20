import React, { useState ,useEffect } from 'react';
import { View, Button, StyleSheet, Text, FlatList, 
TouchableOpacity,ImageBackground, ActivityIndicator} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';


export default function RefrigeratorParameters({route}){
    const { fridgeId,selectedItem } = route.params;
    const navigation = useNavigation();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ParametersList, setParametersList] = useState([]);


    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await axios.get('http://10.0.0.8:12345/parameter_list',{
                params: { refrigerator_id:fridgeId },
            });
            setParametersList(response.data); 
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

            const itemExists = ParametersList.some(item => item.barcode === newItem.barcode);
        
            if(!itemExists){
                setParametersList((prevParameters) => [...prevParameters, {   
                        product_name:newItem.product_name,
                        barcode:newItem.barcode,
                        amount:1
                }]);
            }
        }
    }, [route.params?.item]);
    
    if (loading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        );
    }

    
    const handleRemoveParameter = (item)=>{
        if(item.amount==1){
          const newParameterList=ParametersList.filter(currentItem => currentItem.product_name != item.product_name); 
          setParametersList(newParameterList);
        }
        else{
          newAmount=item.amount-1;
          updateParameterAmount(item.barcode,newAmount)
        }
    };
    
    const handleAddParameter = (item)=>{
        newAmount=item.amount+1;
        updateParameterAmount(item.barcode,newAmount);
    };
    
    
    const updateParameterAmount = (barcode, newAmount) => {
        setParametersList(prevParameters =>
          prevParameters.map(item =>
            item.barcode === barcode ? { ...item, amount: newAmount} : item
          )
        );
    };
    
    const handleApplyChanges = async () =>{
        try{
            await axios.post('http://10.0.0.8:12345/update_refrigerator_parameters', ParametersList,{
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


    const renderParameterItem = ({ item }) => (
        <View style={styles.parameterItemContainer}>
          <View style={styles.parameterItem}>
            <TouchableOpacity  
              onPress={ ()=> handleAddParameter(item)}
              style={styles.parameterButton}
            >
              <Text style={styles.plus}>+</Text>
            </TouchableOpacity>
            <Text style={styles.itemText}>{item.product_name}</Text>
            <TouchableOpacity  
              onPress={ ()=> handleRemoveParameter(item)}
              style={styles.parameterButton}
            >
              { item.amount==1&& <Text style={styles.remove}>X</Text> }
              { item.amount!=1&& <View style={styles.minusSign} /> }
            </TouchableOpacity>
          </View>
          <Text style={styles.itemText}>{item.amount}</Text>
        </View>
    );

    return (
        <ImageBackground
            source={require('../assets/images/background.jpg')}
            style={styles.imageBackground}
        >
            <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Parameters List:</Text>
                <FlatList
                    data={ParametersList}
                    renderItem={renderParameterItem}
                    keyExtractor={(item) => item.product_name}
                    contentContainerStyle={styles.listContent}
                />
                <Button title="Apply changes" onPress={handleApplyChanges} />
                <TouchableOpacity 
                    style={styles.rightButton}
                    onPress={() => navigation.navigate('SearchProduct',{fridgeId:1})} 
                >
                    <Text style={styles.rightButtonText}> Search</Text>
                </TouchableOpacity>
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
    rightButton: {
      position: 'absolute',
      right: 16,
      bottom: 16,
      backgroundColor: '#FF6347',
      padding: 10,
    },
    rightButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
});
