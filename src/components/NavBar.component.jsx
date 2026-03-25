import React, { useState, useRef, useEffect } from "react";
import navBarStyles from "../styles/NavBar.module.css";
import NavTab from "./NavTab.component";
import { useAuthentification } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { useLanguage } from "../context/LanguageContext";
import Image from "next/image";
import Link from "next/link";
import TourGuide from "./TourGuide.component";

function Navbar() {
  const { logout, user } = useAuthentification();
  const { wallets, selectedId, selectWallet } = useWallet();
  const { lang, toggleLanguage } = useLanguage();
  const [active, setActive] = useState("accueil");
  const [menu, setMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);


  const isAdmin = user && (user.isAdmin || user.admin);

  useEffect(() => {
    function handleClickOutside(e) {
  if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleMenu() {
    setMenu((prevState) => !prevState);
  }

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  const selectedWallet = wallets?.[selectedId];
const selectedLabel = isAdmin && selectedWallet?.user
  ? `${selectedWallet.user.email} — P.${selectedId + 1}`
  : `Portefeuille n°${selectedId + 1}`;
  return (
    <>
      {user && <TourGuide lang={lang} />}

      <nav className={navBarStyles.navBarContainer}>

        {/* SECTION GAUCHE */}
        <div className={navBarStyles.leftSection}>
          <div id="tour-logo" className={navBarStyles.logoContainerLeft}>
            <Link href={"/"}>
              <Image src="/assets/INVEST.png" width={100} height={120} alt="logo" />
            </Link>
          </div>

          <ul
            className={`${navBarStyles.navButtonContainer} ${menu ? navBarStyles.isActived : ""}`}
            onClick={() => setMenu(false)}
          >
            <NavTab handleToggle={setActive} active={active} id="accueil" tourId="tour-accueil" title={lang === "fr" ? "Accueil" : "Home"} to="/" />
            <NavTab handleToggle={setActive} active={active} id="wallet" tourId="tour-wallet" title={lang === "fr" ? "Portefeuille" : "Wallet"} to="/wallet" />
            <NavTab handleToggle={setActive} active={active} id="market" tourId="tour-market" title={lang === "fr" ? "Marchés" : "Markets"} to="/market" />
            <NavTab handleToggle={setActive} active={active} id="ranking" tourId="tour-ranking" title={lang === "fr" ? "Classement" : "Ranking"} to="/ranks" />
            {user && user.admin && (
              <NavTab handleToggle={setActive} active={active} id="admin" title="Admin 🔒" to="/admin" />
            )}
          </ul>
        </div>

        {/* SECTION CENTRE */}
        {user && wallets && (
          <div id="tour-portfolio-badge" className={navBarStyles.centerSection}>

            {isAdmin && (
              <div style={{

              }}>
              </div>
            )}

            {isAdmin ? (
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowDropdown((v) => !v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#fff',
                    border: '1.5px solid #f3ca3e',
                    borderRadius: '12px',
                    padding: '8px 14px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#1a1a1a',
                    maxWidth: '280px',
                  }}
                >
                  <span>📁</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedLabel}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: '10px' }}>{showDropdown ? '▲' : '▼'}</span>
                </button>

                {showDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    backgroundColor: '#fff',
                    border: '1px solid #eee',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    zIndex: 1000,
                    minWidth: '300px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    padding: '8px 0',
                  }}>
                    {/* Mes wallets en premier */}
                    <div style={{ padding: '6px 14px', fontSize: '10px', color: '#aaa', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Mes portefeuilles
                    </div>
                    {wallets.map((wallet, index) => {
                      const isMyWallet = wallet.user?.isAdmin;
                      if (!isMyWallet) return null;
                      const isSelected = selectedId === index;
                      return (
                        <button
                          key={index}
                          onClick={() => { selectWallet(index); setShowDropdown(false); }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '9px 14px',
                            border: 'none',
                            backgroundColor: isSelected ? '#fff8e1' : 'transparent',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: isSelected ? '700' : '500',
                            color: '#1a1a1a',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            borderLeft: isSelected ? '3px solid #f3ca3e' : '3px solid transparent',
                          }}
                        >
                          <span>👤</span>
                          <span>{wallet.user?.email || 'Admin'} — P.{index + 1}</span>
                          {isSelected && <span style={{ marginLeft: 'auto', color: '#f3ca3e' }}>✓</span>}
                        </button>
                      );
                    })}

                    {/* Séparateur */}
                    <div style={{ borderTop: '1px solid #f0f0f0', margin: '6px 0' }} />
                    <div style={{ padding: '6px 14px', fontSize: '10px', color: '#aaa', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Tous les utilisateurs
                    </div>

                    {wallets.map((wallet, index) => {
                      const isMyWallet = wallet.user?.isAdmin;
                      if (isMyWallet) return null;
                      const isSelected = selectedId === index;
                      return (
                        <button
                          key={index}
                          onClick={() => { selectWallet(index); setShowDropdown(false); }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '9px 14px',
                            border: 'none',
                            backgroundColor: isSelected ? '#fff8e1' : 'transparent',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: isSelected ? '700' : '500',
                            color: '#1a1a1a',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            borderLeft: isSelected ? '3px solid #f3ca3e' : '3px solid transparent',
                          }}
                        >
                          <span>👤</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {wallet.user?.email || `Wallet ${index + 1}`} — P.{index + 1}
                          </span>
                          {isSelected && <span style={{ marginLeft: 'auto', color: '#f3ca3e' }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className={navBarStyles.portfolioBadge}>
                <span className={navBarStyles.walletIcon}>📁</span>
                <span className={navBarStyles.portfolioTitle}>
                  {lang === "fr" ? `Portefeuille n°${selectedId + 1}` : `Portfolio #${selectedId + 1}`}
                </span>
                <div className={navBarStyles.miniSelector}>
                  {wallets.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); selectWallet(index); }}
                      className={selectedId === index ? navBarStyles.miniBtnActive : navBarStyles.miniBtn}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION DROITE */}
        <div className={navBarStyles.rightSection}>
          <button id="tour-lang" className={navBarStyles.langBtn} onClick={toggleLanguage}>
            {lang === "fr" ? "ENGLISH" : "FRANÇAIS"}
          </button>

          {user && (
            <div className={navBarStyles.userInfoRight}>
              <span className={navBarStyles.userEmail}>{user.email}</span>
              <span className={navBarStyles.separator}>|</span>
            </div>
          )}

          <div id="tour-logout" className={navBarStyles.logoutBtn} onClick={() => setShowLogoutModal(true)}>
            <Image src="/assets/deco6.png" width={30} height={30} alt="Déconnexion" />
          </div>
        </div>

        {/* MODAL DÉCONNEXION */}
        {showLogoutModal && (
          <div className={navBarStyles.modalOverlay}>
            <div className={navBarStyles.modalBox}>
              <h3>{lang === "fr" ? "Déconnexion" : "Logout"}</h3>
              <p>
                {lang === "fr"
                  ? "Êtes-vous sûr de vouloir vous déconnecter ?"
                  : "Are you sure you want to log out?"}
              </p>
              <div className={navBarStyles.modalButtons}>
                <button className={navBarStyles.confirmBtn} onClick={handleConfirmLogout}>
                  {lang === "fr" ? "Oui, me déconnecter" : "Yes, log me out"}
                </button>
                <button className={navBarStyles.cancelBtn} onClick={() => setShowLogoutModal(false)}>
                  {lang === "fr" ? "Annuler" : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BURGER MOBILE */}
        <div className={`${navBarStyles.menu} ${menu ? navBarStyles.change : ""}`} onClick={toggleMenu}>
          <div className={navBarStyles.menuLine1}></div>
          <div className={navBarStyles.menuLine2}></div>
          <div className={navBarStyles.menuLine3}></div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;