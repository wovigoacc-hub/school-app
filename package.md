# ─── Navigation ──────────────────────────────────────────────────────────────
npm install @react-navigation/native @react-navigation/native-stack
npm install @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context

# ─── State management ────────────────────────────────────────────────────────
npm install @reduxjs/toolkit react-redux

# ─── Secure storage (replaces AsyncStorage entirely) ─────────────────────────
npm install react-native-keychain
npm install react-native-mmkv                 
# offline queue + fast local state

# ─── Networking ──────────────────────────────────────────────────────────────
npm install axios

# ─── UI & Styling ────────────────────────────────────────────────────────────
npm install nativewind
npm install tailwindcss                        
 # peer dep for nativewind
npm install react-native-reanimated
npm install react-native-gesture-handler
npm install @gorhom/bottom-sheet              
 # AttendanceSheet, FilePicker
npm install react-native-modal

# ─── Images & Files ──────────────────────────────────────────────────────────
npm install react-native-image-picker
npm install react-native-document-picker
npm install react-native-fast-image            
# cached image loading

# ─── Push Notifications ──────────────────────────────────────────────────────
npm install @react-native-firebase/app
npm install @react-native-firebase/messaging

# ─── Charts (marks progress trend) ──────────────────────────────────────────
npm install react-native-svg
npm install react-native-gifted-charts        
 # line + bar charts using svg

# ─── Calendar (attendance view) ──────────────────────────────────────────────
npm install react-native-calendars

# ─── Network status ──────────────────────────────────────────────────────────
npm install @react-native-community/netinfo

# ─── i18n ────────────────────────────────────────────────────────────────────
npm install i18next react-i18next

# ─── Forms ───────────────────────────────────────────────────────────────────
npm install react-hook-form

# ─── Date handling ───────────────────────────────────────────────────────────
npm install dayjs

# ─── Dev tools ───────────────────────────────────────────────────────────────
npm install --save-dev reactotron-react-native reactotron-redux
npm install --save-dev @types/react-native-keychain

# ─── iOS only (run after npm install) ────────────────────────────────────────
cd ios && pod install