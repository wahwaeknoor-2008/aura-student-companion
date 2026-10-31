
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";

type Message = {
  id: number;
  text: string;
  sender: "aura" | "user";
};

const quickActions = [
  { title: "My tasks", detail: "Keep track of what needs doing" },
  { title: "Academic planner", detail: "Courses, assignments, and deadlines" },
  { title: "Daily habits", detail: "Small steps toward a balanced day" },
];

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hey! I'm AURA. I'm here for you. How are you doing today?",
      sender: "aura",
    },
  ]);

  const sendMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    const userMessage: Message = {
      id: Date.now(),
      text: trimmedMessage,
      sender: "user",
    };

    setMessages((previous) => [...previous, userMessage]);
    setMessage("");
  };

  if (chatOpen) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.chatHeader}>
            <Pressable onPress={() => setChatOpen(false)}>
              <Text style={styles.backButton}>← Back</Text>
            </Pressable>

            <View style={styles.chatTitleContainer}>
              <Text style={styles.chatTitle}>AURA</Text>
              <Text style={styles.onlineText}>Your student companion</Text>
            </View>

            <View style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
            </View>
          </View>

          <ScrollView
            style={styles.chatMessages}
            contentContainerStyle={styles.chatMessagesContent}
          >
            <Text style={styles.chatDate}>YOUR CONVERSATION</Text>

            {messages.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.messageBubble,
                  item.sender === "user"
                    ? styles.userBubble
                    : styles.auraBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    item.sender === "user"
                      ? styles.userMessageText
                      : styles.auraMessageText,
                  ]}
                >
                  {item.text}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Message AURA..."
              placeholderTextColor="#9995A9"
              style={styles.messageInput}
              multiline
              maxLength={2000}
              onSubmitEditing={sendMessage}
            />

            <Pressable
              onPress={sendMessage}
              style={({ pressed }) => [
                styles.sendButton,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.sendButtonText}>↑</Text>
            </Pressable>
          </View>

          <Text style={styles.chatDisclaimer}>
            AURA supports your independence. You are always in control.
          </Text>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>YOUR STUDENT COMPANION</Text>
            <Text style={styles.logo}>AURA</Text>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.greeting}>
            A little progress goes a long way.
          </Text>

          <Text style={styles.subheading}>
            Your day, your pace. What would you like to focus on?
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.companionButton,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => setChatOpen(true)}
          >
            <Text style={styles.companionButtonText}>
              Talk to AURA →
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Your day</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>A fresh start</Text>

          <Text style={styles.summaryText}>
            Your tasks, habits, and academic plans will come together here.
          </Text>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          <Text style={styles.progressCaption}>
            Your daily progress will appear here
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Quick access</Text>

        {quickActions.map((item) => (
          <View key={item.title} style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>
                {item.title.charAt(0)}
              </Text>
            </View>

            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>{item.title}</Text>
              <Text style={styles.actionDetail}>{item.detail}</Text>
            </View>

            <Text style={styles.chevron}>›</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          AURA is here to support your independence, not replace it.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F7FB",
  },
  container: {
    padding: 22,
    paddingTop: 28,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  eyebrow: {
    color: "#77758B",
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: "700",
  },
  logo: {
    color: "#25223A",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E9E4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#6250B5",
    fontWeight: "800",
    fontSize: 17,
  },
  hero: {
    backgroundColor: "#292544",
    borderRadius: 24,
    padding: 22,
    marginBottom: 28,
  },
  greeting: {
    color: "#FFFFFF",
    fontSize: 25,
    lineHeight: 32,
    fontWeight: "700",
    maxWidth: 280,
  },
  subheading: {
    color: "#D9D5EA",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  companionButton: {
    alignSelf: "flex-start",
    backgroundColor: "#DCD5FF",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  companionButtonText: {
    color: "#302858",
    fontWeight: "700",
  },
  sectionTitle: {
    color: "#28253D",
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 13,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#ECEBF2",
  },
  summaryTitle: {
    color: "#29263E",
    fontSize: 16,
    fontWeight: "700",
  },
  summaryText: {
    color: "#77758B",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#F0EFF5",
    borderRadius: 8,
    marginTop: 18,
  },
  progressFill: {
    width: "12%",
    height: 8,
    backgroundColor: "#8271D4",
    borderRadius: 8,
  },
  progressCaption: {
    color: "#89869A",
    fontSize: 11,
    marginTop: 8,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ECEBF2",
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconText: {
    color: "#6250B5",
    fontWeight: "800",
    fontSize: 16,
  },
  actionCopy: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    color: "#29263E",
    fontSize: 14,
    fontWeight: "700",
  },
  actionDetail: {
    color: "#858296",
    fontSize: 11,
    marginTop: 4,
  },
  chevron: {
    color: "#9894A8",
    fontSize: 25,
    paddingHorizontal: 4,
  },
  footer: {
    color: "#89869A",
    textAlign: "center",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 24,
    paddingHorizontal: 14,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#ECEBF2",
  },
  backButton: {
    color: "#6250B5",
    fontWeight: "700",
    fontSize: 15,
  },
  chatTitleContainer: {
    alignItems: "center",
  },
  chatTitle: {
    color: "#292544",
    fontWeight: "800",
    fontSize: 20,
    letterSpacing: 1,
  },
  onlineText: {
    color: "#89869A",
    fontSize: 11,
    marginTop: 3,
  },
  chatMessages: {
    flex: 1,
  },
  chatMessagesContent: {
    paddingVertical: 20,
  },
  chatDate: {
    color: "#9995A9",
    textAlign: "center",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 22,
  },
  messageBubble: {
    maxWidth: "85%",
    padding: 15,
    borderRadius: 18,
    marginBottom: 12,
  },
  auraBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#E9E4FF",
    borderBottomLeftRadius: 5,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#292544",
    borderBottomRightRadius: 5,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },
  auraMessageText: {
    color: "#292544",
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 7,
    borderWidth: 1,
    borderColor: "#ECEBF2",
  },
  messageInput: {
    flex: 1,
    color: "#292544",
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    maxHeight: 100,
    outlineStyle: "none",
  },
  sendButton: {
    width: 42,
    height: 42,
    backgroundColor: "#6250B5",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  chatDisclaimer: {
    color: "#9995A9",
    fontSize: 10,
    textAlign: "center",
    marginTop: 10,
  },
});
