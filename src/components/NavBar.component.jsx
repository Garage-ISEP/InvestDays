import React, { useState } from "react";
import navBarStyles from "../styles/NavBar.module.css";
import NavTab from "./NavTab.component";
import { useAuthentification } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { useLanguage } from "../context/LanguageContext";
import Image from "next/image";
import Link from "next/link";

function Navbar() {
  const { logout, user } = useAuthentification();
  const { wallets, selectedId, selectWallet } = useWallet();
  const { lang, toggleLanguage } = useLanguage();
  const [active, setActive] = useState("accueil");
  const [menu, setMenu] = useState(false);

  function toggleMenu() {
    setMenu((prevState) => !prevState);
  }

  return (
    <nav className={navBarStyles.navBarContainer}>
      
      <div className={navBarStyles.leftSection}>
        <div className={navBarStyles.logoContainerLeft}>
          <Link href={"/"}>
            <Image src="/assets/INVEST.png" width={100} height={120} alt="logo" priority />
          </Link>
        </div>

        <ul
          className={`${navBarStyles.navButtonContainer} ${menu ? navBarStyles.isActived : ""}`}
          onClick={() => setMenu(false)}
        >
          <NavTab handleToggle={setActive} active={active} id="accueil" title={lang === "fr" ? "Accueil" : "Home"} to="/" />
          <NavTab handleToggle={setActive} active={active} id="wallet" title={lang === "fr" ? "Portefeuille" : "Wallet"} to="/wallet" />
          <NavTab handleToggle={setActive} active={active} id="market" title={lang === "fr" ? "Marchés" : "Markets"} to="/market" />
          <NavTab handleToggle={setActive} active={active} id="ranking" title={lang === "fr" ? "Classement" : "Ranking"} to="/ranks" />
          
          {user && user.admin && (
            <NavTab 
              handleToggle={setActive} 
              active={active} 
              id="admin" 
              title={lang === "fr" ? "Admin 🔒" : "Admin 🔒"} 
              to="/admin" 
            />
          )}
        </ul>
      </div>

      {user && wallets && (
        <div className={navBarStyles.centerSection}>
          <div className={navBarStyles.portfolioBadge}>
            <span className={navBarStyles.walletIcon}>📁</span>
            <span className={navBarStyles.portfolioTitle}>
              {lang === "fr" ? `Portfolio n°${selectedId + 1}` : `Portfolio #${selectedId + 1}`}
            </span>
            <div className={navBarStyles.miniSelector}>
              {wallets.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectWallet(index);
                  }}
                  className={selectedId === index ? navBarStyles.miniBtnActive : navBarStyles.miniBtn}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={navBarStyles.rightSection}>
        <button 
          className={navBarStyles.langBtn} 
          onClick={toggleLanguage}
        >
          {lang === "fr" ? "🇺🇸 EN" : "🇫🇷 FR"}
        </button>

        {user && (
          <div className={navBarStyles.userInfoRight}>
            <span className={navBarStyles.userEmail}>{user.email}</span>
            <span className={navBarStyles.separator}>|</span>
          </div>
        )}
        
        <div className={navBarStyles.logoutBtn} onClick={() => logout()}>
          <Image src="/assets/deco6.png" width={30} height={30} alt="Déconnexion" />
        </div>
      </div>

      <div className={`${navBarStyles.menu} ${menu ? navBarStyles.change : ""}`} onClick={toggleMenu}>
        <div className={navBarStyles.menuLine1}></div>
        <div className={navBarStyles.menuLine2}></div>
        <div className={navBarStyles.menuLine3}></div>
      </div>
    </nav>
  );
}

export default Navbar;