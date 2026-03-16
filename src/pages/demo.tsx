import Head from "next/head";
import { useEffect, useState } from "react";
import { useAuthentification } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Image from "next/image";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import styles from "../styles/Login.module.css";

export default function Demo() {
  const router = useRouter();
  const { completeCasLogin, isAuthenticated } = useAuthentification();
  const { lang, toggleLanguage } = useLanguage();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const t = (lang === "en" ? {
    headTitle: "InvestDays - Demo",
    tagline: "Simulate. Invest. Progress.",
    hint: "Visitor access",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Password",
    loginBtn: "Sign in",
    successToast: "Login successful!",
    errorCredentials: "Incorrect email or password.",
  } : {
    headTitle: "InvestDays - Démo",
    tagline: "Simulez. Investissez. Progressez.",
    hint: "Accès visiteur",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Mot de passe",
    loginBtn: "Se connecter",
    successToast: "Connexion réussie !",
    errorCredentials: "Email ou mot de passe incorrect.",
  });

  useEffect(() => {
    if (isAuthenticated) router.push("/");
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw data.message || t.errorCredentials;
      completeCasLogin(data);
      toast.success(t.successToast, {
        className: styles.customToast,
        progressClassName: styles.customProgress,
      });
    } catch (err: any) {
      setError(typeof err === "string" ? err : t.errorCredentials);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{t.headTitle}</title>
        <link rel="icon" href="/favicon3.ico" />
      </Head>

      <button onClick={toggleLanguage} className={styles.langToggle}>
        {lang === "fr" ? "🇺🇸 EN" : "🇫🇷 FR"}
      </button>

      <div className={styles.page}>
        <div className={styles.bgCircle1} />
        <div className={styles.bgCircle2} />
        <div className={styles.bgGrid} />

        <div className={styles.wrapper}>
          <div className={styles.logoWrap}>
            <Image src="/assets/INVEST.png" width={200} height={200} alt="InvestDays" priority />
          </div>

          <div className={styles.card}>
            <div className={styles.cardTop}>
              <h1 className={styles.appName}>Invest<span className={styles.accent}>Days</span></h1>
              <p className={styles.tagline}>{t.tagline}</p>
            </div>

            <div className={styles.divider} />

            <div className={styles.cardBottom}>
              <p className={styles.optionHint}>{t.hint}</p>

              <form onSubmit={handleLogin} className={styles.form}>
                <div className={styles.inputWrap}>
                  <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    className={styles.input}
                    type="email"
                    placeholder={t.emailPlaceholder}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className={styles.inputWrap}>
                  <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    className={styles.input}
                    type={showPassword ? "text" : "password"}
                    placeholder={t.passwordPlaceholder}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>

                {error && <p className={styles.error}>{error}</p>}

                <button type="submit" className={styles.isepBtn} disabled={loading}>
                  {loading ? <span className={styles.spinner} /> : t.loginBtn}
                </button>
              </form>

              <button className={styles.backBtn} onClick={() => router.push("/login")}>
              </button>
            </div>
          </div>

          <div className={styles.footerRow}>
            <a href="https://finage.co.uk" target="_blank" rel="noreferrer" className={styles.finageLink}>
              <img
                src="/assets/partners/finage_logo.svg"
                alt="Finage"
                style={{ height: "24px", filter: "grayscale(100%) brightness(1.4)", opacity: 0.7, transition: "all 0.2s" }}
                onMouseOver={e => { e.currentTarget.style.filter = "grayscale(0%)"; e.currentTarget.style.opacity = "1"; }}
                onMouseOut={e => { e.currentTarget.style.filter = "grayscale(100%) brightness(1.4)"; e.currentTarget.style.opacity = "0.7"; }}
              />
            </a>
            <p className={styles.footer}>InvestDays © 2025 — ISEP</p>
          </div>
        </div>
      </div>
    </>
  );
}