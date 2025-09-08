import { useState } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { LoginForm } from "./components/LoginForm";
import { ForgotPasswordForm } from "./components/ForgotPasswordForm";
import { SignUpForm } from "./components/SignUpForm";

type CurrentView = "login" | "forgot-password" | "sign-up";

export default function App() {
  const [currentView, setCurrentView] =
    useState<CurrentView>("login");

  const handleForgotPassword = () => {
    setCurrentView("forgot-password");
  };

  const handleSignUp = () => {
    setCurrentView("sign-up");
  };

  const handleBackToLogin = () => {
    setCurrentView("login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col">
      <Header
        showBackButton={currentView === "forgot-password" || currentView === "sign-up"}
        onBack={handleBackToLogin}
      />

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {currentView === "login" ? (
              <LoginForm
                onForgotPassword={handleForgotPassword}
                onSignUp={handleSignUp}
              />
            ) : currentView === "forgot-password" ? (
              <ForgotPasswordForm
                onBackToLogin={handleBackToLogin}
              />
            ) : (
              <SignUpForm
                onBackToLogin={handleBackToLogin}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}