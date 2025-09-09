import { Sprout, ArrowLeft } from "lucide-react";

interface HeaderProps {
  showBackButton?: boolean;
  onBack?: () => void;
}

export function Header({
  showBackButton = false,
  onBack,
}: HeaderProps) {
  return (
    <header className="w-full bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <Sprout className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Farm Assistant
            </h1>
            <p className="text-sm text-gray-600">
              Hỗ trợ nông dân thông minh
            </p>
          </div>
        </div>

        {/* Back Button or Home Link */}
        {showBackButton ? (
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-green-600 hover:text-green-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về đăng nhập</span>
          </button>
        ) : (
          <button className="text-green-600 hover:text-green-700">
            ← Về trang chủ
          </button>
        )}
      </div>
    </header>
  );
}