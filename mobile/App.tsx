import React, { useEffect, useState } from "react";
import {
  SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";

// Update this only if your Codespaces backend URL changes.
const API_BASE_URL =
  "https://scary-spooky-cadaver-4jr9jqqg57r6c56x-8000.app.github.dev";
const TOKEN_KEY = "aura_access_token";

const tokenStorage = {
  get: async () => Platform.OS === "web"
    ? (globalThis as any).localStorage?.getItem(TOKEN_KEY) ?? null
    : SecureStore.getItemAsync(TOKEN_KEY),
  set: async (value: string) => Platform.OS === "web"
    ? (globalThis as any).localStorage?.setItem(TOKEN_KEY, value)
    : SecureStore.setItemAsync(TOKEN_KEY, value),
  remove: async () => Platform.OS === "web"
    ? (globalThis as any).localStorage?.removeItem(TOKEN_KEY)
    : SecureStore.deleteItemAsync(TOKEN_KEY),
};

type Screen = "loading" | "login" | "register" | "verify" | "createPassword" | "forgot" | "reset" | "dashboard";
type Message = { id: number; text: string; sender: "aura" | "user" };

const quickActions = [
  { title: "My tasks", detail: "Keep track of what needs doing" },
  { title: "Academic planner", detail: "Courses, assignments, and deadlines" },
  { title: "Daily habits", detail: "Small steps toward a balanced day" },
];

async function api(path: string, body?: unknown, token?: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map((x: any) => x.msg).join(", ")
      : data.detail;
    throw new Error(`${response.status}: ${detail || "Request failed"}`);
  }
  return data;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [token, setToken] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hey! I'm AURA. I'm here for you. How are you doing today?", sender: "aura" },
  ]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const saved = await tokenStorage.get();
        if (saved) {
          const me = await api("/auth/me", undefined, saved);
          if (active) {
            setToken(saved);
            setStudentEmail(me.email);
            setScreen("dashboard");
            return;
          }
          await tokenStorage.remove();
        }
      } catch {
        await tokenStorage.remove().catch(() => {});
      }
      if (active) setScreen("login");
    })();
    return () => { active = false; };
  }, []);

  const runAction = async (action: () => Promise<void>) => {
    setBusy(true); setError(""); setNotice("");
    try { await action(); }
    catch (e) { setError(e instanceof Error ? e.message : "Something went wrong. Please try again."); }
    finally { setBusy(false); }
  };

  const register = () => runAction(async () => {
    const cleanEmail = email.trim().toLowerCase();
    await api("/auth/register", { email: cleanEmail });
    setEmail(cleanEmail);
    setStudentEmail(cleanEmail);
    setNotice("Verification requested. In development, find the 6-digit code in the backend terminal running Uvicorn.");
    setScreen("verify");
  });

  const verify = () => runAction(async () => {
    await api("/auth/verify", { email: (studentEmail || email).trim().toLowerCase(), code: code.trim() });
    setNotice("Email verified. Now create your AURA password.");
    setScreen("createPassword");
  });

  const completeRegistration = () => runAction(async () => {
    await api("/auth/complete-registration", {
      email: (studentEmail || email).trim().toLowerCase(),
      password,
    });
    setPassword("");
    setNotice("Your AURA account is ready. Please log in.");
    setScreen("login");
  });

  const login = () => runAction(async () => {
    const data = await api("/auth/login", { email: email.trim().toLowerCase(), password });
    await tokenStorage.set(data.access_token);
    setToken(data.access_token);
    setStudentEmail(data.student.email);
    setPassword("");
    setNotice("");
    setScreen("dashboard");
  });

  const requestReset = () => runAction(async () => {
    const cleanEmail = email.trim().toLowerCase();
    await api("/auth/forgot-password", { email: cleanEmail });
    setStudentEmail(cleanEmail);
    setNotice("If the account exists, a reset code has been created. In development, check the backend terminal running Uvicorn.");
    setScreen("reset");
  });

  const resetPassword = () => runAction(async () => {
    await api("/auth/reset-password", {
      email: (studentEmail || email).trim().toLowerCase(),
      code: code.trim(),
      new_password: newPassword,
    });
    setPassword("");
    setNewPassword("");
    setCode("");
    setNotice("Password reset. You can now log in with your new password.");
    setScreen("login");
  });

  const logout = async () => {
    await tokenStorage.remove();
    setToken(""); setPassword(""); setChatOpen(false); setScreen("login");
    setNotice("You have been logged out.");
  };

  const sendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed || isLoading) return;
    const history = messages.map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text,
    }));
    setMessages((prev) => [...prev, { id: Date.now(), text: trimmed, sender: "user" }]);
    setMessage(""); setIsLoading(true);
    try {
      const data = await api("/chat", { message: trimmed, history }, token);
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: data.reply, sender: "aura" }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Connection error";
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        text: msg.includes("401")
          ? "Your session expired. Please log in again."
          : `I'm having trouble connecting right now. ${msg}`,
        sender: "aura",
      }]);
      if (msg.toLowerCase().includes("session") || msg.includes("401")) {
        await tokenStorage.remove();
        setToken(""); setChatOpen(false); setScreen("login");
      }
    } finally { setIsLoading(false); }
  };

  const field = (value: string, onChangeText: (v: string) => void, placeholder: string, secure = false, keyboardType: any = "default") => (
    <TextInput
      value={value} onChangeText={onChangeText} placeholder={placeholder}
      placeholderTextColor="#9995A9" secureTextEntry={secure}
      keyboardType={keyboardType} autoCapitalize="none" autoCorrect={false}
      style={styles.field} editable={!busy}
    />
  );

  const button = (label: string, onPress: () => void, secondary = false) => (
    <Pressable disabled={busy} onPress={onPress} style={[styles.button, secondary && styles.secondaryButton, busy && { opacity: 0.6 }]}>
      {busy ? <ActivityIndicator color={secondary ? "#6250B5" : "#FFFFFF"} /> :
        <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{label}</Text>}
    </Pressable>
  );

  const authScreen = (title: string, subtitle: string, children: React.ReactNode) => (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.authOuter} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>YOUR STUDENT COMPANION</Text>
          <Text style={styles.logo}>AURA</Text>
          <View style={styles.authCard}>
            <Text style={styles.authTitle}>{title}</Text>
            <Text style={styles.authSubtitle}>{subtitle}</Text>
            {!!notice && <Text style={styles.notice}>{notice}</Text>}
            {!!error && <Text style={styles.error}>{error}</Text>}
            {children}
            <Text style={styles.authFoot}>Your day, your pace. Your information stays under your control.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  if (screen === "loading") {
    return <SafeAreaView style={[styles.safeArea, styles.center]}><ActivityIndicator size="large" color="#6250B5" /><Text style={styles.muted}>Opening AURA…</Text></SafeAreaView>;
  }

  if (screen === "login") return authScreen("Welcome back", "Log in to continue to your student companion.",
    <>
      {field(email, setEmail, "University email", false, "email-address")}
      {field(password, setPassword, "AURA password", true)}
      {button("Log in", login)}
      <Pressable onPress={() => { setError(""); setNotice(""); setScreen("register"); }}><Text style={styles.link}>Create an account</Text></Pressable>
      <Pressable onPress={() => { setError(""); setNotice(""); setScreen("forgot"); }}><Text style={styles.link}>Forgot password?</Text></Pressable>
    </>);

  if (screen === "register") return authScreen("Create your account", "Use your university email. AURA will never ask for your university password.",
    <>
      {field(email, setEmail, "University email", false, "email-address")}
      {button("Send verification code", register)}
      <Pressable onPress={() => { setError(""); setNotice(""); setScreen("login"); }}><Text style={styles.link}>Back to login</Text></Pressable>
    </>);

  if (screen === "verify") return authScreen("Verify your email", `Enter the 6-digit code for ${studentEmail || email}.`,
    <>
      {field(code, setCode, "6-digit verification code", false, "number-pad")}
      {button("Verify email", verify)}
      <Pressable onPress={() => { setError(""); setNotice(""); setScreen("register"); }}><Text style={styles.link}>Use a different email</Text></Pressable>
    </>);

  if (screen === "createPassword") return authScreen("Create your password", "Choose a unique AURA password with at least 12 characters.",
    <>
      {field(password, setPassword, "New AURA password (12+ characters)", true)}
      {button("Create account", completeRegistration)}
    </>);

  if (screen === "forgot") return authScreen("Reset password", "We'll create a one-time reset code for your registered email.",
    <>
      {field(email, setEmail, "University email", false, "email-address")}
      {button("Request reset code", requestReset)}
      <Pressable onPress={() => { setError(""); setNotice(""); setScreen("login"); }}><Text style={styles.link}>Back to login</Text></Pressable>
    </>);

  if (screen === "reset") return authScreen("Choose a new password", `Enter the reset code for ${studentEmail || email} and choose a new password.`,
    <>
      {field(code, setCode, "6-digit reset code", false, "number-pad")}
      {field(newPassword, setNewPassword, "New password (12+ characters)", true)}
      {button("Reset password", resetPassword)}
    </>);

  if (chatOpen) return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.chatContainer} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.chatHeader}>
          <Pressable onPress={() => setChatOpen(false)} disabled={isLoading}><Text style={styles.link}>← Back</Text></Pressable>
          <View style={styles.chatTitleContainer}><Text style={styles.chatTitle}>AURA</Text><Text style={styles.onlineText}>Your student companion</Text></View>
          <View style={styles.avatar}><Text style={styles.avatarText}>A</Text></View>
        </View>
        <ScrollView style={styles.chatMessages} contentContainerStyle={styles.chatMessagesContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.chatDate}>YOUR CONVERSATION</Text>
          {messages.map((item) => <View key={item.id} style={[styles.messageBubble, item.sender === "user" ? styles.userBubble : styles.auraBubble]}>
            <Text style={[styles.messageText, item.sender === "user" ? styles.userMessageText : styles.auraMessageText]}>{item.text}</Text>
          </View>)}
          {isLoading && <View style={[styles.messageBubble, styles.auraBubble]}><ActivityIndicator color="#6250B5" /><Text style={styles.typingText}>AURA is thinking…</Text></View>}
        </ScrollView>
        <View style={styles.inputContainer}>
          <TextInput value={message} onChangeText={setMessage} placeholder="Message AURA…" placeholderTextColor="#9995A9" style={styles.messageInput} multiline maxLength={4000} editable={!isLoading} />
          <Pressable onPress={sendMessage} disabled={!message.trim() || isLoading} style={[styles.sendButton, (!message.trim() || isLoading) && { opacity: 0.45 }]}><Text style={styles.sendButtonText}>↑</Text></Pressable>
        </View>
        <Text style={styles.chatDisclaimer}>AURA supports your independence. You are always in control.</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>YOUR STUDENT COMPANION</Text><Text style={styles.logo}>AURA</Text></View>
          <View style={styles.avatar}><Text style={styles.avatarText}>A</Text></View>
        </View>
        <View style={styles.hero}>
          <Text style={styles.greeting}>A little progress goes a long way.</Text>
          <Text style={styles.subheading}>Your day, your pace. What would you like to focus on?</Text>
          <Pressable style={styles.companionButton} onPress={() => setChatOpen(true)}><Text style={styles.companionButtonText}>Talk to AURA →</Text></Pressable>
        </View>
        <Text style={styles.sectionTitle}>Your day</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>A fresh start</Text>
          <Text style={styles.summaryText}>Your tasks, habits, and academic plans will come together here.</Text>
          <View style={styles.progressTrack}><View style={styles.progressFill} /></View>
          <Text style={styles.progressCaption}>Your daily progress will appear here</Text>
        </View>
        <Text style={styles.sectionTitle}>Quick access</Text>
        {quickActions.map((item) => <View key={item.title} style={styles.actionCard}>
          <View style={styles.actionIcon}><Text style={styles.actionIconText}>{item.title.charAt(0)}</Text></View>
          <View style={styles.actionCopy}><Text style={styles.actionTitle}>{item.title}</Text><Text style={styles.actionDetail}>{item.detail}</Text></View>
          <Text style={styles.chevron}>›</Text>
        </View>)}
        <Text style={styles.footer}>Signed in as {studentEmail}. AURA supports your independence, not replaces it.</Text>
        <Pressable onPress={logout} style={styles.logoutButton}><Text style={styles.logoutText}>Log out</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F7F7FB" },
  center: { justifyContent: "center", alignItems: "center", gap: 12 },
  authOuter: { flex: 1 },
  authContent: { flexGrow: 1, justifyContent: "center", padding: 22, paddingVertical: 40 },
  authCard: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 22, marginTop: 22, borderWidth: 1, borderColor: "#ECEBF2" },
  authTitle: { color: "#292544", fontSize: 25, fontWeight: "800", marginBottom: 7 },
  authSubtitle: { color: "#77758B", fontSize: 14, lineHeight: 21, marginBottom: 18 },
  authFoot: { color: "#9995A9", fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 20 },
  field: { backgroundColor: "#F8F7FC", borderWidth: 1, borderColor: "#E8E5F1", borderRadius: 13, paddingHorizontal: 14, paddingVertical: 14, color: "#292544", fontSize: 14, marginBottom: 12 },
  button: { backgroundColor: "#6250B5", borderRadius: 14, padding: 15, alignItems: "center", justifyContent: "center", minHeight: 50, marginTop: 5 },
  buttonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  secondaryButton: { backgroundColor: "#EEEAFE" },
  secondaryButtonText: { color: "#6250B5" },
  link: { color: "#6250B5", fontSize: 14, fontWeight: "700", textAlign: "center", padding: 12 },
  notice: { color: "#315F48", backgroundColor: "#EAF6EF", padding: 11, borderRadius: 10, fontSize: 12, lineHeight: 18, marginBottom: 12 },
  error: { color: "#9B3030", backgroundColor: "#FCEEEE", padding: 11, borderRadius: 10, fontSize: 12, lineHeight: 18, marginBottom: 12 },
  muted: { color: "#77758B" },
  container: { padding: 22, paddingTop: 28, paddingBottom: 40 },
  eyebrow: { color: "#77758B", fontSize: 10, letterSpacing: 1.8, fontWeight: "700" },
  logo: { color: "#25223A", fontSize: 30, fontWeight: "800", letterSpacing: 2 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#E9E4FF", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#6250B5", fontWeight: "800", fontSize: 17 },
  hero: { backgroundColor: "#292544", borderRadius: 24, padding: 22, marginBottom: 28 },
  greeting: { color: "#FFFFFF", fontSize: 25, lineHeight: 32, fontWeight: "700", maxWidth: 280 },
  subheading: { color: "#D9D5EA", fontSize: 14, lineHeight: 21, marginTop: 10 },
  companionButton: { alignSelf: "flex-start", backgroundColor: "#DCD5FF", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, marginTop: 20 },
  companionButtonText: { color: "#302858", fontWeight: "700" },
  sectionTitle: { color: "#28253D", fontSize: 19, fontWeight: "700", marginBottom: 13 },
  summaryCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 18, marginBottom: 28, borderWidth: 1, borderColor: "#ECEBF2" },
  summaryTitle: { color: "#29263E", fontSize: 16, fontWeight: "700" },
  summaryText: { color: "#77758B", fontSize: 13, lineHeight: 19, marginTop: 6 },
  progressTrack: { height: 8, backgroundColor: "#F0EFF5", borderRadius: 8, marginTop: 18 },
  progressFill: { width: "12%", height: 8, backgroundColor: "#8271D4", borderRadius: 8 },
  progressCaption: { color: "#89869A", fontSize: 11, marginTop: 8 },
  actionCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 17, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#ECEBF2" },
  actionIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#F0EDFF", alignItems: "center", justifyContent: "center" },
  actionIconText: { color: "#6250B5", fontWeight: "800", fontSize: 16 },
  actionCopy: { flex: 1, marginLeft: 12 },
  actionTitle: { color: "#29263E", fontSize: 14, fontWeight: "700" },
  actionDetail: { color: "#858296", fontSize: 11, marginTop: 4 },
  chevron: { color: "#9894A8", fontSize: 25, paddingHorizontal: 4 },
  footer: { color: "#89869A", textAlign: "center", fontSize: 11, lineHeight: 17, marginTop: 24, paddingHorizontal: 14 },
  logoutButton: { alignSelf: "center", padding: 12, marginTop: 8 },
  logoutText: { color: "#6250B5", fontWeight: "700" },
  chatContainer: { flex: 1, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12 },
  chatHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: "#ECEBF2" },
  chatTitleContainer: { alignItems: "center" },
  chatTitle: { color: "#292544", fontWeight: "800", fontSize: 20, letterSpacing: 1 },
  onlineText: { color: "#89869A", fontSize: 11, marginTop: 3 },
  chatMessages: { flex: 1 },
  chatMessagesContent: { paddingVertical: 20 },
  chatDate: { color: "#9995A9", textAlign: "center", fontSize: 10, fontWeight: "700", letterSpacing: 1.2, marginBottom: 22 },
  messageBubble: { maxWidth: "85%", padding: 15, borderRadius: 18, marginBottom: 12 },
  auraBubble: { alignSelf: "flex-start", backgroundColor: "#E9E4FF", borderBottomLeftRadius: 5 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#292544", borderBottomRightRadius: 5 },
  messageText: { fontSize: 14, lineHeight: 21 },
  auraMessageText: { color: "#292544" },
  userMessageText: { color: "#FFFFFF" },
  inputContainer: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFFFFF", borderRadius: 18, padding: 7, borderWidth: 1, borderColor: "#ECEBF2" },
  messageInput: { flex: 1, color: "#292544", fontSize: 14, paddingHorizontal: 10, paddingVertical: 10, maxHeight: 100 },
  sendButton: { width: 42, height: 42, backgroundColor: "#6250B5", borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sendButtonText: { color: "#FFFFFF", fontSize: 22, fontWeight: "800" },
  typingText: { color: "#6250B5", fontSize: 13, marginTop: 5 },
  chatDisclaimer: { color: "#9995A9", fontSize: 10, textAlign: "center", marginTop: 10 },
});
