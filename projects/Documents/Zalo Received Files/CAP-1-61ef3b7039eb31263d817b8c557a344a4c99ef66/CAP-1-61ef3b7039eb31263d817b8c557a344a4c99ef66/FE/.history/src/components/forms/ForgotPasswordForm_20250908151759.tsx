import { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Forgot password email:", email);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md mx-auto space-y-4"
    >
      {/* Icon + tiêu đề */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-600 text-white">
          <i className="fas fa-lock text-xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Quên mật khẩu?</h2>
        <p className="text-gray-600">
          Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu
        </p>
      </div>

      {/* Input email */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email đã đăng ký
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-green-500 focus:ring-green-500"
          placeholder="Nhập email của bạn"
        />
      </div>

      {/* Nút gửi hướng dẫn */}
      <button
        type="submit"
        className="w-full rounded-lg bg-green-600 py-2 font-medium text-white hover:bg-green-700"
      >
        Gửi hướng dẫn đặt lại
      </button>

      {/* Quay lại đăng nhập */}
      <p className="text-center text-sm">
        Nhớ lại mật khẩu?{" "}
        <Link to="/login" className="font-medium text-green-600 hover:underline">
          Đăng nhập ngay
        </Link>
      </p>

      {/* Hỗ trợ */}
      <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-gray-600">
        <p className="font-medium text-blue-700">Cần hỗ trợ?</p>
        <p>
          Nếu bạn không nhận được email hoặc gặp vấn đề khác, vui lòng liên hệ:
        </p>
        <p className="mt-1">
          📞 Hotline: <span className="font-medium text-green-600">1900 1234</span>
        </p>
        <p>
          📧 Email:{" "}
          <a
            href="mailto:support@farmassistant.vn"
            className="text-green-600 hover:underline"
          >
            support@farmassistant.vn
          </a>
        </p>
      </div>
    </form>
  );
}
