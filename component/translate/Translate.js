import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Image, Modal, FlatList, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import axios from 'axios';

const translateText = async (text, fromLanguage, toLanguage) => {
  try {
    const response = await axios.post('http://192.168.1.10:5000/translate', {

      text: text,
      from: fromLanguage,
      to: toLanguage,
    });
    return response.data.translation;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};

const languageOptions = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'mr', name: 'Marathi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'bn', name: 'Bengali' },
  { code: 'kn', name: 'Kannada' },
  { code: 'te', name: 'Telugu' },
  { code: 'ml', name: 'Malayalam' },
];

const Translate = () => {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [image, setImage] = useState(null);
  const [recording, setRecording] = useState(null);
  const [modalVisible, setModalVisible] = useState({ language1: false, language2: false });
  const [selectedLanguage1, setSelectedLanguage1] = useState('en');
  const [selectedLanguage2, setSelectedLanguage2] = useState('hi');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [translationHeight, setTranslationHeight] = useState(100);
  const [isLoading, setIsLoading] = useState(false); // New loading state

  const navigation = useNavigation();

  const handleUploadNavigation = () => {
    navigation.navigate('UploadScreen');
  };
  
  const handleScanNavigation = () => {
    navigation.navigate('Text-To-Speech'); // Updated screen name
  };

  const handleTranslate = async () => {
    setIsLoading(true); // Show loader
    try {
      const translation = await translateText(text1, selectedLanguage1, selectedLanguage2);
      if (translation) {
        setText2(translation);
      } else {
        setText2("Translation failed or returned no result.");
      }
    } catch (error) {
      console.error('Translation error:', error);
      setText2("An error occurred during translation.");
    }
    setIsLoading(false); // Hide loader
  };;

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
        await recording.startAsync();
        setRecording(recording);
      } else {
        alert('Permission to access microphone is required!');
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      console.log('Recording stopped and stored at', uri);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const clearText = (setText) => {
    setText('');
  };

  const handleLanguageSelect = (language, type) => {
    if (type === 'language1') {
      setSelectedLanguage1(language.code);
    } else {
      setSelectedLanguage2(language.code);
    }
    setModalVisible({ ...modalVisible, [type]: false });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Translate</Text>
        <View
          style={[styles.translationBox, isFullscreen && styles.fullscreenBox]}
        >
          <TouchableOpacity
            onPress={() =>
              setModalVisible({ ...modalVisible, language1: true })
            }
          >
            <Text style={styles.languageText}>
              {languageOptions.find((lang) => lang.code === selectedLanguage1)
                ?.name || "Select Language"}
            </Text>
          </TouchableOpacity>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter text"
              placeholderTextColor="#808080"
              value={text1}
              onChangeText={setText1}
              multiline={true}
            />
            {text1 ? (
              <TouchableOpacity onPress={() => clearText(setText1)}>
                <Icon
                  name="close"
                  size={wp("6%")}
                  color="#ffffff"
                  style={styles.clearIcon}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={recording ? stopRecording : startRecording}
              >
                <Icon
                  name="mic"
                  size={wp("6%")}
                  color="#ffffff"
                  style={styles.microphoneIcon}
                />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={() =>
              setModalVisible({ ...modalVisible, language2: true })
            }
          >
            <Text style={[styles.languageText, { color: "#5beeee" }]}>
              {languageOptions.find((lang) => lang.code === selectedLanguage2)
                ?.name || "Select Language"}
            </Text>
          </TouchableOpacity>

          {/* Loader will show here while translating */}
          {isLoading ? (
            <ActivityIndicator
              size="large"
              color="#5beeee"
              style={styles.loader}
            />
          ) : (
            <View style={styles.textInputContainer}>
              <TextInput
                style={[styles.textoutput, { height: translationHeight }]}
                placeholder="Translation appears here"
                placeholderTextColor="#808080"
                value={text2}
                onChangeText={setText2}
                editable={false}
                multiline={true}
                scrollEnabled={true}
                onContentSizeChange={(e) =>
                  setTranslationHeight(e.nativeEvent.contentSize.height)
                }
              />
              {text2 ? (
                <TouchableOpacity onPress={() => clearText(setText2)}>
                  <Icon
                    name="close"
                    size={wp("6%")}
                    color="#5beeee"
                    style={styles.clearIcon}
                  />
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {/* Centered Translate Button */}
          <TouchableOpacity
            onPress={handleTranslate}
            style={styles.translateButton}
          >
            <Text style={styles.translateButtonText}>Translate</Text>
          </TouchableOpacity>

          {image && <Image source={{ uri: image }} style={styles.image} />}
          <TouchableOpacity
            style={styles.fullscreenButton}
            onPress={toggleFullscreen}
          >
            <Icon
              name={isFullscreen ? "fullscreen-exit" : "fullscreen"}
              size={wp("6%")}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer Fixed at the Bottom */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton} onPress={() => {}}>
          <Icon name="translate" size={wp("8%")} color="#5beeee" />
          <Text style={styles.footerButtonText}>Translation</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={handleUploadNavigation}
        >
          <Icon name="upload-file" size={wp("8%")} color="#5beeee" />
          <Text style={styles.footerButtonText}>Upload</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={handleScanNavigation}
        >
          <Icon name="audiotrack" size={wp("8%")} color="#5beeee" />
          <Text style={styles.footerButtonText}>TTS</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for Language Selection for Language1 */}
      <Modal
        visible={modalVisible.language1}
        animationType="slide"
        transparent={true}
        onRequestClose={() =>
          setModalVisible({ ...modalVisible, language1: false })
        }
      >
        <View style={styles.modalContainer}>
          <FlatList
            data={languageOptions}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleLanguageSelect(item, "language1")}
                style={styles.languageOption}
              >
                <Text style={styles.languageOptionText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            onPress={() =>
              setModalVisible({ ...modalVisible, language1: false })
            }
            style={styles.modalCloseButton}
          >
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Modal for Language Selection for Language2 */}
      <Modal
        visible={modalVisible.language2}
        animationType="slide"
        transparent={true}
        onRequestClose={() =>
          setModalVisible({ ...modalVisible, language2: false })
        }
      >
        <View style={styles.modalContainer}>
          <FlatList
            data={languageOptions}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleLanguageSelect(item, "language2")}
                style={styles.languageOption}
              >
                <Text style={styles.languageOptionText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            onPress={() =>
              setModalVisible({ ...modalVisible, language2: false })
            }
            style={styles.modalCloseButton}
          >
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: wp("4%"),
    paddingTop: hp("2%"),
  },
  title: {
    fontSize: wp("8%"),
    color: '#ffffff',
    marginBottom: hp("2%"),
  },
  translationBox: {
    backgroundColor: '#1f1f1f',
    borderRadius: 10,
    padding: wp("4%"),
    marginBottom: hp("2%"),
    position: 'relative',
  },
  fullscreenBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: '#1f1f1f',
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp("2%"),
    marginBottom: hp("3%"),
    backgroundColor: '#2c2c2c',
    borderRadius: 10,
    padding: wp("2%"),
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: wp("4%"),
    paddingHorizontal: wp("2%"),
    paddingVertical: hp("2%"),
    backgroundColor: '#2c2c2c',
    borderRadius: 10,
  },
  textoutput: {
    flex: 1,
    color: '#ffffff',
    fontSize: wp("4%"),
    paddingHorizontal: wp("2%"),
    paddingVertical: hp("7%"),
    backgroundColor: '#2c2c2c',
    borderRadius: 10,
  },
  clearIcon: {
    marginLeft: wp("2%"),
  },
  microphoneIcon: {
    marginLeft: wp("2%"),
  },
  languageText: {
    color: '#ffffff',
    fontSize: wp("5%"),
  },
  translateButton: {
    backgroundColor: '#5beeee',
    borderRadius: 10,
    paddingVertical: hp("1.5%"),
    paddingHorizontal: wp("4%"),
    alignItems: 'center',
    marginTop: hp("2%"),
    marginBottom: hp("2%"),
  },
  translateButtonText: {
    fontSize: wp("5%"),
    color: '#ffffff',
  },
  image: {
    width: wp("90%"),
    height: hp("30%"),
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: hp("2%"),
  },
  fullscreenButton: {
    position: 'absolute',
    top: wp("2%"),
    right: wp("2%"),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#121212',
    paddingVertical: hp("1%"),
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  footerButton: {
    alignItems: 'center',
  },
  footerButtonText: {
    color: '#5beeee',
    fontSize: wp("3%"),
    marginTop: hp("0.5%"),
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp("12%"),
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  languageOption: {
    marginTop: hp("1%"),
    backgroundColor: '#2c2c2c',
    borderRadius: 10,
    padding: wp("3%"),
    marginVertical: hp("1%"),
    width: wp("80%"),
    alignItems: 'center',
  },
  languageOptionText: {
    color: '#ffffff',
    fontSize: wp("5%"),
  },
  modalCloseButton: {
    marginBottom: hp("5%"),
    padding: wp("2%"),
    backgroundColor: '#5beeee',
    borderRadius: 10,
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontSize: wp("5%"),
  },
  loader: {
    marginTop: 20,
  },
});

export default Translate;
