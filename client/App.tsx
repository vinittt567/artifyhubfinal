import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import NotFound from "./pages/NotFound";
import FeedPage from "./pages/Feed";
import LoginPage from "./pages/auth/Login";
import SignupPage from "./pages/auth/Signup";
import ForgotPasswordPage from "./pages/auth/Forgot";
import CreatePostPage from "./pages/CreatePost";
import SearchPage from "./pages/Search";
import MessagesPage from "./pages/Messages";
import SingleChatPage from "./pages/SingleChat";
import UserProfilePage from "./pages/profile/UserProfile";
import ProfileEditPage from "./pages/profile/ProfileEdit";
import ActivityPage from "./pages/Activity";
import SetupPage from "./pages/Setup";
import DebugPage from "./pages/Debug";
import PostDetailPage from "./pages/PostDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/debug" element={<DebugPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* Legacy auth routes redirect */}
            <Route path="/auth/login" element={<Navigate to="/login" replace />} />
            <Route path="/auth/signup" element={<Navigate to="/signup" replace />} />
            <Route path="/auth/forgot" element={<Navigate to="/forgot-password" replace />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="/feed" element={<PrivateRoute><FeedPage /></PrivateRoute>} />
            <Route path="/post/:postId" element={<PrivateRoute><PostDetailPage /></PrivateRoute>} />
            <Route path="/search" element={<PrivateRoute><SearchPage /></PrivateRoute>} />
            <Route path="/messages" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
            <Route path="/messages/:conversationId" element={<PrivateRoute><SingleChatPage /></PrivateRoute>} />
            <Route path="/create" element={<PrivateRoute><CreatePostPage /></PrivateRoute>} />
            <Route path="/activity" element={<PrivateRoute><ActivityPage /></PrivateRoute>} />
            <Route path="/profile/me" element={<PrivateRoute><UserProfilePage /></PrivateRoute>} />
            <Route path="/profile/edit" element={<PrivateRoute><ProfileEditPage /></PrivateRoute>} />
            <Route path="/profile/:username" element={<PrivateRoute><UserProfilePage /></PrivateRoute>} />
            
            {/* Legacy routes redirect */}
            <Route path="/create-post" element={<Navigate to="/create" replace />} />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);