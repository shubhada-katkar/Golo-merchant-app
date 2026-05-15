import AuthLayout from "./../../components/AuthLayout";

export default function ResetSent() {
  return (
    <AuthLayout>
      <div className="center-card">
        <h2>Reset link sent</h2>
        <p>
          Email sent with verification link. Check your inbox or spam folder.
        </p>

        <input placeholder="Email" className="input-field" />

        <button className="primary-btn">Resend email</button>
      </div>
    </AuthLayout>
  );
}