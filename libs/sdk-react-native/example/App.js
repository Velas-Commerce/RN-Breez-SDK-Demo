/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { useState } from "react"
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View, Button, Clipboard, Alert } from "react-native"
import { StyleSheet, TextInput } from 'react-native';
import { addEventListener, addLogListener, initServices, mnemonicToSeed, Network, nodeInfo, recoverNode, registerNode, start, receivePayment, sendPayment } from "react-native-breez-sdk"
import BuildConfig from "react-native-build-config"
import { generateMnemonic } from "@dreson4/react-native-quick-bip39"
import { getSecureItem, setSecureItem } from "./utils/storage"


const MNEMONIC_STORE = "MNEMONIC_SECURE_STORE"
const GREENLIGHT_DEVICE_KEY_STORE = "GREENLIGHT_DEVICE_KEY_SECURE_STORE"
const GREENLIGHT_DEVICE_CERT_STORE = "GREENLIGHT_DEVICE_CERT_SECURE_STORE"

const DebugLine = ({ title, text }) => {
    return (
        <TouchableOpacity style={{ flex: 1 }}>
            <View style={{ margin: 5 }}>
                <Text style={{ fontWeight: "bold" }}>{title}</Text>
                {text && text.length > 0 ? <Text>{text}</Text> : <></>}
            </View>
        </TouchableOpacity>
    )
}

const App = () => {
    const [amount, onChangeAmount] = React.useState('');
    const [description, onChangeDescription] = React.useState('');
    const [bolt11Invoice, onChangeInvoice] = React.useState('');
    const [balance, onChangeBalance] = React.useState(0);

    const [lines, setLines] = useState([])

    const addLine = (title, text) => {
        setLines((lines) => [{ at: new Date().getTime(), title, text }, ...lines])
    }

    const createPaymentInvoice = async () => {
        try {
            const iAmount = parseInt(amount, 10)
            const invoice = await receivePayment(iAmount, description)
            addLine("Bolt11 Invoice", invoice.bolt11);
            Clipboard.setString(invoice.bolt11);
            Alert.alert('Invoice Created', `Invoice for ${iAmount} Sats coplied to clipboard`,
                [{ text: 'OK', onPress: () => console.log('OK Pressed') }])
        } catch (error) {
            addLine("error", JSON.stringify(error));
            console.log(error);
        }

    }
    const FulfilPaymentInvoice = async () => {
        try {
            if (bolt11Invoice != "") {
                const payment = sendPayment(bolt11Invoice, undefined);
                addLine("payment", JSON.stringify(payment))
                setTimeout(5000, async () => {
                    let ni = await nodeInfo();
                    onChangeBalance((_balance) => ni.channelsBalanceMsat);
                })
            }

        } catch (error) {
            addLine("error", JSON.stringify(error));
            console.log(error);
        }
    }

    const logHandler = (l) => {
        addLine("log", `${l.line}: ${l.level}`)
    }

    const eventHandler = (type, data) => {
        addLine("event", `${type}${data ? ' : ' + JSON.stringify(data) : ''}`)
    }

    React.useEffect(() => {
        const asyncFn = async () => {
            await addLogListener(logHandler)
            await addEventListener(eventHandler)

            let seed = null
            let mnemonic = await getSecureItem(MNEMONIC_STORE)

            if (!mnemonic) {
                mnemonic = generateMnemonic(256)
                setSecureItem(MNEMONIC_STORE, mnemonic)

                seed = await mnemonicToSeed(mnemonic)
                const greenlightCredentials = await registerNode(Network.TESTNET, seed)

                setSecureItem(GREENLIGHT_DEVICE_KEY_STORE, greenlightCredentials.deviceKey)
                setSecureItem(GREENLIGHT_DEVICE_CERT_STORE, greenlightCredentials.deviceCert)
            } else {
                seed = await mnemonicToSeed(mnemonic)
            }

            let deviceKey = await getSecureItem(GREENLIGHT_DEVICE_KEY_STORE)
            let deviceCert = await getSecureItem(GREENLIGHT_DEVICE_CERT_STORE)

            if (!deviceKey) {
                const greenlightCredentials = await recoverNode(Network.BITCOIN, seed)

                addLine("recoverNode", null)
                setSecureItem(GREENLIGHT_DEVICE_KEY_STORE, greenlightCredentials.deviceKey)
                setSecureItem(GREENLIGHT_DEVICE_CERT_STORE, greenlightCredentials.deviceCert)
                deviceKey = greenlightCredentials.deviceKey
                deviceCert = greenlightCredentials.deviceCert
            }


            if (deviceKey && deviceCert) {
                await initServices(BuildConfig.BREEZ_API_KEY, deviceKey, deviceCert, seed)
                await start()
                try {
                    let ni = await nodeInfo();
                    console.log(ni);
                    addLine("NodeInfo", JSON.stringify(ni));
                    onChangeBalance((_balance) => ni.channelsBalanceMsat);
                } catch (error) {
                    addLine("error", JSON.stringify(error));
                }
            }
        }
        asyncFn()
    }, [])

    const styles = StyleSheet.create({
        input: {
            height: 40,
            marginTop: 15,
            margin: 12,
            borderWidth: 1,
            padding: 10,
        },
        balance: {
            fontSize: 50,
            padding: 20,
            marginBottom: 10,
            color: 'darkblue',
            fontWeight: 'bold',
        },
        text: {
            margin: 5,
            padding: 5,
        },
        payView: {
            margin: 5,
            padding: 5,
            borderWidth: 1,
        }

    });


    return (
        <SafeAreaView>
            <View style={styles.payView}>
                <StatusBar />
                <Text style={{ marginTop: 5 }}>
                    Balance:
                </Text>
                <Text style={styles.balance}>
                    {balance} MSats
                </Text>

                <Text style={styles.text}>
                    Receive Satoshis
                </Text>
                <TextInput
                    style={styles.input}
                    onChangeText={onChangeAmount}
                    value={amount}
                    placeholder="Amount in SATs"
                    keyboardType="numeric"
                />
                <TextInput
                    style={styles.input}
                    onChangeText={onChangeDescription}
                    value={description}
                    placeholder="Description"
                />
                <Button
                    title="Generate Invoice"
                    onPress={createPaymentInvoice}
                />

                <Text style={styles.text}>
                    Send Satoshis
                </Text>
                <TextInput
                    style={styles.input}
                    onChangeText={onChangeInvoice}
                    multiline={true}
                    value={bolt11Invoice}
                    placeholder="Bolt11 Invoice"
                />
                <Button
                    title="Fulfil Invoice"
                    onPress={FulfilPaymentInvoice}
                />
            </View>
            <ScrollView style={{ padding: 5, marginTop: 10 }}>
                {lines.map((line) => (
                    <DebugLine key={line.at} title={line.title} text={line.text} />
                ))}
            </ScrollView>
        </SafeAreaView>
    )
}

export default App
