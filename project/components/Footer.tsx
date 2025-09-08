export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200 px-6 py-4 mt-auto">
      <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>© 2024 Farm Assistant</span>
          <button className="hover:text-green-600">Điều khoản</button>
          <button className="hover:text-green-600">Bảo mật</button>
        </div>
        <div className="flex items-center space-x-4">
          <span>Hỗ trợ</span>
          <span className="font-medium text-green-600">1900 1234</span>
        </div>
      </div>
    </footer>
  );
}