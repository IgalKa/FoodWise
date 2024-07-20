import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, FlatList, 
TouchableOpacity, Alert,Image ,Modal,ImageBackground} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import Share from 'react-native-share';
import CustomButton from '../components/CustomButton';

export default function ShoppingList ({route}) {
  const { fridgeId } = route.params;
  const navigation = useNavigation();

  const [error, setError] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [ShoppingList, setShoppingList] = useState([]);
  const [ParametersList, setParametersList] = useState([]);


  const handleGenrateShoppingList = async () => {
    try{
        const response = await axios.get('http://10.0.0.8:12345/create_shopping_list',{
            params: { refrigerator_id:fridgeId },
        });
        setShoppingList(response.data); // Assuming response.data is an array of strings
        setModalVisible(true); // Show the modal after data is fetched
        
    }catch(error){
        console.error('Error fetching search results:', error);
        setError('Failed to fetch search results. Please try again.');
    }

  };

  const handleShoppingList = () => {
      setModalVisible(true);      
  };

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


  const handleShareList = () => {
    const listString = ShoppingList.map(item => `${item.product_name}, ${item.lack}`).join('\n');

    const shareOptions = {
      title: 'My List',
      message: listString,
    };

    Share.open(shareOptions)
      .then((res) => console.log(res))
      .catch((err) => err && console.log(err));
  };
  

  const renderShoppingItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item.product_name}</Text>
      <Text style={styles.itemText}>{item.lack}</Text>
    </View>
  );

  return (
    <ImageBackground
      source={require('../assets/images/background.jpg')}
      style={styles.imageBackground}
    >

        <CustomButton
          title="saved shopping list"
          onPress={handleShoppingList}
        />
        
        <CustomButton 
          title="generate shopping list" 
          onPress={handleGenrateShoppingList} 
        />

        <CustomButton
          title="edit shopping list parameters" 
          onPress={() => navigation.navigate('RefrigeratorParameters',{fridgeId:1})}  
        />

        <Modal
          animationType="slide"
          transparent={false}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false); // Close modal when pressing hardware back button on Android
          }}
        >    
          <ImageBackground
            source={require('../assets/images/background.jpg')}
            style={styles.imageBackground}
          >
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Shopping List:</Text>
              <FlatList
                data={ShoppingList}
                renderItem={renderShoppingItem}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={styles.listContent}
              />
              <View style={styles.buttonContainer}>
                <CustomButton title="Close" onPress={() => setModalVisible(false)} />
                <CustomButton title="Share" onPress={handleShareList} />
              </View>
            </View>
          </ImageBackground>       
        </Modal>
     
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

