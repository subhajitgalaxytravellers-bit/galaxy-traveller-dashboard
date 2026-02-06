import api from "@/lib/api";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function SocialGoogleButton() {
  const navigate = useNavigate();
  const handleSuccess = async (credentialResponse) => {
    try {
      const token = credentialResponse.credential;
      const res = await api().post("/api/auth/google", { token });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast.success("Login successful.");
      navigate("/");
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Login failed.";
      toast.error(message);
      console.error("Login failed:", err);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => console.log("Login Failed")}
      ux_mode="popup"
      prompt="select_account"
    />
  );
}
