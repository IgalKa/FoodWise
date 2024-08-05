import React, { useState ,useEffect} from 'react';
import { View, StyleSheet, Text, FlatList, Modal,ImageBackground} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Share from 'react-native-share';
import CustomButton from '../components/CustomButton';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export default function ShoppingList ({route}) {
  const { fridgeId } = useAuth();
  const navigation = useNavigation();


  const [modalVisible, setModalVisible] = useState(false);

  const [ShoppingList, setShoppingList] = useState([]);

  
  const handleShoppingList = async () => {
    try {
      const response = await axios.get('http://10.0.0.8:12345/shopping_list',{
          params: { refrigerator_id:fridgeId },
      });
      setShoppingList(response.data); 
      setModalVisible(true);
    } 
    catch (error) {
      console.error('Error fetching search results:', error);
    }
  };


  const handleShareList = () => {
    const listString = ShoppingList.map(item => `${item.product_name}, ${item.amount}`).join('\n');

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
      <Text style={styles.itemText}>{item.amount}</Text>
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
          onPress={() => navigation.navigate('EditList',{
            getUrl:"http://10.0.0.8:12345/create_shopping_list",
            postUrl:"http://10.0.0.8:12345/save_shopping_list",
            title:"shopping list creation",
            fridgeId:1})} 
        />

        <CustomButton
          title="edit shopping list parameters" 
          onPress={() => navigation.navigate('EditList',{
            getUrl:"http://10.0.0.8:12345/parameter_list",
            postUrl:"http://10.0.0.8:12345/update_refrigerator_parameters",
            title:"parameters list",
            fridgeId:1
            })}  
        />

        <Modal
          animationType="slide"
          transparent={false}
          visible={modalVisible}
          onRequestClose={() => {setModalVisible(false); }}
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

