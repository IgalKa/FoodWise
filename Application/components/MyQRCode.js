import React from 'react';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const MyQRCode = ({ value }) => {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <QRCode
                value={value}
                size={200}
            />
        </View>
    );
};

export default MyQRCode;