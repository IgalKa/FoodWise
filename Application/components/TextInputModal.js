import React from 'react';
import { Modal, View, Text, TextInput, StyleSheet } from 'react-native';
import { Button } from '@rneui/themed';

const TextInputModal = ({
    isVisible,
    onClose,
    newName,
    setNewName,
    onAction,
    title,
    actionButtonTitle
}) => {
    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <TextInput
                        style={styles.input}
                        value={newName}
                        onChangeText={setNewName}
                    />
                    <View style={styles.buttonContainer}>
                        <View style={styles.renameButton}>
                            <Button color="#465881" title={actionButtonTitle} onPress={onAction} />
                        </View>
                        <View style={styles.cancelButton}>
                            <Button color="warning" title="Cancel" onPress={onClose} />
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default TextInputModal;




const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '80%',
        padding: 20,
        backgroundColor: '#c6cbef',
        borderRadius: 10,
    },
    modalTitle: {
        color: '#465881',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    input: {
        height: 40,
        borderColor: '#465881',
        borderWidth: 2,
        marginBottom: 10,
        paddingHorizontal: 10,
        color: '#465881',
    },
    buttonContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start'
    },
    renameButton: {
        width: '50%',
        paddingRight: 2.5,
    },
    cancelButton: {
        width: '50%',
        paddingLeft: 2.5,
    },
});