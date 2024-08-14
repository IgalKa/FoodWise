import { View,ActivityIndicator } from "react-native";

const Loading = () => {
    return (
        <View style={styles.centeredView}>
            < ActivityIndicator size="large" color="#fff" />
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

export default Loading;