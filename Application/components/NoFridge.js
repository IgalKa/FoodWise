
import { View,Text,StyleSheet } from "react-native";

const NoFridge = () =>{
    return (
        <View style={styles.centeredView}>
              <Text style={styles.title}> please choose a fridge first</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center', // Centers content vertically
        alignItems: 'center',     // Centers content horizontally
    },
    title: {
        fontSize: 20,
        color: '#fff', // White color for the text
        textAlign: 'center', // Centers text horizontally
    },
  });
  


export default NoFridge;

