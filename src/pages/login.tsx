import Head from "next/head";
import { useEffect, useState } from "react";
import { useAuthentification } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext"; 
import Image from "next/image";
import { toast } from "react-toastify";
import { useRouter } from 'next/router';
import styles from "../styles/Login.module.css";

export default function Login() {
  const router = useRouter();
  const { completeCasLogin, isAuthenticated } = useAuthentification();
  const { lang, toggleLanguage } = useLanguage();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const translations = {
    fr: {
      headTitle: "Invest Days - Connexion",
      tagline: "Simulez. Investissez. Progressez.",
      hint: "Connectez-vous avec votre compte ISEP",
      loginBtn: "Portail ISEP",
      successToast: "Connexion réussie !",
      errorSession: "Erreur lors de la lecture de la session.",
    },
    en: {
      headTitle: "Invest Days - Login",
      tagline: "Simulate. Invest. Progress.",
      hint: "Log in with your ISEP account",
      loginBtn: "ISEP Portal",
      successToast: "Login successful!",
      errorSession: "Error reading session data.",
    }
  };

  const t = translations[lang as keyof typeof translations] || translations.fr;

  useEffect(() => {
    if (router.isReady && router.query.user) {
      try {
        const rawData = Array.isArray(router.query.user) ? router.query.user[0] : router.query.user;
        const userData = JSON.parse(decodeURIComponent(rawData));
        completeCasLogin(userData);
        toast.success(t.successToast, {
          className: styles.customToast,
          progressClassName: styles.customProgress,
        });
      } catch (e) {
        setError(t.errorSession);
      }
    }
  }, [router.isReady, router.query]);

  useEffect(() => {
    if (isAuthenticated) router.push("/");
  }, [isAuthenticated]);

  const handleLoginISEP = () => {
    setLoading(true);
    const baseUrl = window.location.origin; 
    const serviceUrl = `${baseUrl}/api/auth/cas-callback`;
    const casLoginBase = "https://portail-ovh.isep.fr/cas/login";
 
    const finalUrl = `${casLoginBase}?service=${encodeURIComponent(serviceUrl)}`;
    window.location.href = finalUrl;
  };
  return (
    <>
      <Head>
        <title>{t.headTitle}</title>
        <link rel="icon" href="/favicon3.ico" />
      </Head>

      <button 
        onClick={toggleLanguage}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 100,
          padding: '10px 16px',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: '#f3ca3e',
          color: '#1a1a1a',
          fontWeight: '700',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span>{lang === 'fr' ? 'English' : 'Français'}</span>
      </button>

      <div className={styles.page}>
        <div className={styles.bgCircle1} />
        <div className={styles.bgCircle2} />

        <div className={styles.wrapper}>
          <div className={styles.logoWrap}>
            <Image src="/assets/INVEST.png" width={210} height={210} alt="InvestDays" />
          </div>

          <div className={styles.card}>
            <div className={styles.cardTop}>
              <h1 className={styles.appName}>Invest Days</h1>
              <p className={styles.tagline}>{t.tagline}</p>
            </div>

            <div className={styles.divider} />

            <div className={styles.cardBottom}>
              <p className={styles.hint}>{t.hint}</p>

              <button
                className={styles.loginBtn}
                onClick={handleLoginISEP}
                disabled={loading}
              >
                {loading ? (
                  <span className={styles.spinner} />
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    {t.loginBtn}
                  </>
                )}
              </button>

              {error && <p className={styles.error}>{error}</p>}
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <a href="https://finage.co.uk" target="_blank" rel="noreferrer">
              <img 
                src="/assets/partners/finage_logo.svg" 
                alt="Finage Logo" 
                style={{ height: '30px', filter: 'grayscale(100%) brightness(1.5)', opacity: 0.8 }}
                onMouseOver={(e) => e.currentTarget.style.filter = 'grayscale(0%)'}
                onMouseOut={(e) => e.currentTarget.style.filter = 'grayscale(100%) brightness(1.5)'}
              />
            </a>
          </div>
          <p className={styles.footer}>InvestDays © 2025 — ISEP</p>
        </div>
      </div>
    </>
  );
}