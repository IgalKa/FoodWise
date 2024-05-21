import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

const AuthForm = ({
    title,
    fields,
    buttonText,
    onSubmit,
    footerText,
    footerActionText,
    onFooterActionPress,
    loading,
}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            {fields.map((field, index) => (
                <TextInput
                    key={index}
                    style={styles.input}
                    placeholder={field.placeholder}
                    value={field.value}
                    onChangeText={field.onChangeText}
                    keyboardType={field.keyboardType}
                    secureTextEntry={field.secureTextEntry}
                />
            ))}
            <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
                {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>{buttonText}</Text>
                )}
            </TouchableOpacity>
            <View style={styles.footerContainer}>
                <Text style={styles.footerText}>{footerText}</Text>
                <TouchableOpacity onPress={onFooterActionPress}>
                    <Text style={styles.footerActionText}>{footerActionText}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '80%',
    },
    title: {
        fontSize: 50,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'left',
        color: '#fff',
    },
    input: {
        height: 40,
        borderColor: '#fff',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 15,
        color: '#fff',
        width: '100%',
    },
    button: {
        backgroundColor: '#cd87ff',
        paddingVertical: 12,
        borderRadius: 5,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footerContainer: {
        flexDirection: 'row',
        paddingTop: 15,
        justifyContent: 'center',
    },
    footerText: {
        fontSize: 16,
    },
    footerActionText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 5,
    },
});

export default AuthForm;