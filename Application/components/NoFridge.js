
import { View, Text, StyleSheet } from "react-native";

const NoFridge = () => {
    return (
        <View style={styles.centeredView}>
            <Text style={styles.title}> Please select a fridge in My Refrigerators Screen.</Text>
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
        color: '#ededed', // White color for the text
        textAlign: 'center', // Centers text horizontally
    },
});



export default NoFridge;

