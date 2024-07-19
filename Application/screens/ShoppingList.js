import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, FlatList, 
TouchableOpacity, Alert,Image ,Modal,ImageBackground} from 'react-native';
import axios from 'axios';
import ScreenLayout from '../components/ScreenLayout';

export default function ShoppingList ({route}) {
  const [productName, setProductName] = useState('');
  const [results, setResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [error, setError] = useState(null);
  const { fridgeId } = route.params;

  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [parametersVisble,setParametersVisible] =useState(false);
  const [ShoppingList, setShoppingList] = useState([]);
  const [ParametersList, setParametersList] = useState([]);


  const handleSearch = async () => {
    try {
      setError(null); // Clear previous errors
      const response = await axios.get('http://10.0.0.8:12345/find_product_number', {
        params: { product_name: productName },
      });
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching search results:', error);
      setError('Failed to fetch search results. Please try again.');
    }
  };

  const handleItemPress = (item) => {
    if (selectedItem && selectedItem.barcode === item.barcode) {
      setSelectedItem(null); // Deselect if the same item is pressed again
    } else {
      setSelectedItem(item);
    }
  };

  const handleSendSelected = async () => {
    if (selectedItem) {
      try {
        console.log(fridgeId)
        const response = await axios.post('http://10.0.0.8:12345/add_product_to_tracking', {
          barcode: selectedItem.barcode,
          refrigerator_id:fridgeId,
        });
        Alert.alert('Success', 'Selected barcode sent successfully!');
      } catch (error) {
        console.error('Error sending selected barcode:', error);
        Alert.alert('Error', 'Failed to send selected barcode. Please try again.');
      }
    } else {
      Alert.alert('Error', 'No item selected.');
    }
  };

  const handleShoppingList = async () => {
    try{
        setParametersVisible(false);
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

  const handleParametersList = async () => {
    try{
      setParametersVisible(true)
      const response = await axios.get('http://10.0.0.8:12345/parameter_list',{
        params: { refrigerator_id:fridgeId },
      });
      setParametersList(response.data); 
      setModalVisible(true); // Show the modal after data is fetched

    }catch(error){
      console.error('Error fetching search results:', error);
      setError('Failed to fetch search results. Please try again.');
    }
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

  const handleApplyChanges = async () =>{
    try{
      setModalVisible(false)
      setParametersVisible(false)
      const response = await axios.post('http://10.0.0.8:12345/update_refrigerator_parameters', ParametersList,{
        params: {
          refrigerator_id: fridgeId
        }
      });

    }catch(error){
      console.error('Error fetching search results:', error);
      setError('Failed to fetch search results. Please try again.');
    }
  }


  const renderSearchItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.itemContainer, selectedItem && selectedItem.barcode === item.barcode && styles.selectedItem]}
      onPress={() => handleItemPress(item)}
    >
      <Text style={styles.itemText}>{item.product_name}</Text>
    </TouchableOpacity>
  );

  const renderShoppingItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item}</Text>
    </View>
  );

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

        <View style={styles.button}>
          <Button title="generate shopping list" onPress={handleShoppingList} />
        </View>

        <View style={styles.button}>
          <Button title="edit shopping list parameters" onPress={handleParametersList} />
        </View>

        <Modal
          animationType="slide"
          transparent={false}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false); // Close modal when pressing hardware back button on Android
          }}
        >
          {!parametersVisble && (
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
              <Button title="Close" onPress={() => setModalVisible(false)} />
            </View>
          </ImageBackground>
          )}

          {parametersVisble && (
          <ImageBackground
            source={require('../assets/images/background.jpg')}
            style={styles.imageBackground}
          >
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Parameters List:</Text>
              <FlatList
                data={ParametersList}
                renderItem={renderParameterItem}
                keyExtractor={(item) => item.barcode.toString()}
                contentContainerStyle={styles.listContent}
              />
              <Button title="Apply changes" onPress={handleApplyChanges} />
            </View>
          </ImageBackground>
          )}        

        </Modal>


        <View style={styles.searchContainer}>
            <Image source={require('../assets/search.png')} style={styles.searchIcon} />
            <TextInput
                style={styles.searchInput}
                placeholder="Search by item name"
                placeholderTextColor={'#ededed'}
                value={productName}
                onChangeText={setProductName}
                onSubmitEditing={handleSearch}
                returnKeyType="Search" // Customize the return key on the keyboard
            />
        </View>
        {error && <Text style={styles.error}>{error}</Text>}

          
        <FlatList
            style={styles.flatList}
            data={results}
            keyExtractor={(item) => item.barcode.toString()}
            renderItem={renderSearchItem}
            contentContainerStyle={styles.list}
        />

        {selectedItem && (
          <View style={styles.button}>
            <Button style={{marginTop:10}} title="add product" onPress={handleSendSelected} />
          </View>
        )}

        
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
    selectedItem: {
      backgroundColor: '#90ee90',
    },
    error: {
      color: 'red',
      marginVertical: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#fff',
        borderWidth: 0.5,
        borderRadius: 10,
        paddingHorizontal: 16,
        marginBottom: 20,
        width: '90%',
        marginTop: 30,
    },
    searchIcon: {
        width: 24,
        height: 24,
        marginRight: 8,

    },
    searchInput: {
        flex: 1,
        height: 40,
        color: 'white',
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
    }
  });

