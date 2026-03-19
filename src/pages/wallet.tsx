import Head from "next/head";
import Image from "next/image";
import { AppProps } from "next/app";
import { useRouter } from "next/router";
import DashBoardLayout from "../components/layouts/DashBoard.layout";
import TableWallet from "../components/TableWallet.component.jsx";
import { useFetch } from "../context/FetchContext.js";
import homeStyles from "../styles/Home.module.css";
import { useWallet } from "../context/WalletContext";
import { useLanguage } from "../context/LanguageContext"; // Import du context global
import { toast } from "react-toastify";
import { ReactNode } from "react";

export default function Wallet() {
  const {
    wallets,
    selectedId,
    assetsCached,
    actualiseWalletsList,
  } = useWallet();
  const { lang } = useLanguage(); // Récupération de la langue globale
  const router = useRouter();
  const fetch = useFetch();

  // Traductions de la page Portefeuille
  const translations = {
    fr: {
      headTitle: "Invest Days - Portefeuille",
      title: "Portefeuille",
      sub: "Gérez vos actifs et visualisez vos performances",
      newBtn: "+ Nouveau portefeuille",
      searchBtn: "Chercher une action",
      labelAssets: "Valeur des actions",
      labelCash: `Cash portefeuille n°${selectedId + 1}`,
      labelTotal: "Valeur totale indicative",
      toastSuccess: "Nouveau portefeuille créé !",
      toastError: "Erreur lors de la création."
    },
    en: {
      headTitle: "Invest Days - Wallet",
      title: "Wallet",
      sub: "Manage your assets and track your performance",
      newBtn: "+ New Portfolio",
      searchBtn: "Search for a stock",
      labelAssets: "Stocks Value",
      labelCash: `Cash portfolio #${selectedId + 1}`,
      labelTotal: "Estimated total value",
      toastSuccess: "New portfolio created!",
      toastError: "Error during creation."
    }
  };

  // Correction de l'erreur d'indexation TypeScript
  const t = translations[lang as keyof typeof translations];

  async function handleNewWallet() {
    try {
      await fetch.get("/api/wallet/new");
      toast.success(t.toastSuccess);
      actualiseWalletsList();
    } catch (error) {
      toast.error(t.toastError);
    }
  }

  const totalValue = (wallets[selectedId]?.cash || 0) + assetsCached;

  return (
    <>
      <Head>
        <title>{t.headTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon3.ico" />
      </Head>

      <main className={homeStyles.pageContainer}>
        <div className={homeStyles.marketHeader}>
          <div>
            <h1 className={homeStyles.marketTitle}>{t.title}</h1>
            <p className={homeStyles.marketSub}>{t.sub}</p>
          </div>
          
          <div id="tour-wallet-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
             {wallets && wallets.length < 3 && (
                <button 
                  className={homeStyles.filterItem} 
                  onClick={handleNewWallet}
                  style={{ padding: '10px 18px', fontWeight: '600' }}
                >
                  {t.newBtn}
                </button>
             )}
             <button 
                className={homeStyles.buyButton} 
                onClick={() => router.push("/market")}
                style={{ width: 'auto', padding: '12px 25px' }}
              >
                {t.searchBtn}
              </button>
          </div>
        </div>

        <div id="tour-wallet-stats" className={homeStyles.summaryGrid} style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '20px', 
          marginBottom: '40px' 
        }}>
          
          <div className={homeStyles.statCard} style={{ display: 'flex', alignItems: 'center', padding: '20px'}}>
            <div style={{ marginRight: '15px', display: 'flex', alignItems: 'center' }}>
              <Image src="/assets/wallet.svg" width={32} height={32} alt="wallet" />
            </div>
            <div>
              <span className={homeStyles.statLabel}>{t.labelAssets}</span>
              <div className={homeStyles.statValue}>{assetsCached.toFixed(2)} $</div>
            </div>
          </div>
          
          <div className={homeStyles.statCard} style={{ display: 'flex', alignItems: 'center', padding: '20px' }}>
            <div style={{ marginRight: '15px', display: 'flex', alignItems: 'center' }}>
              <Image src="/assets/cash.svg" width={32} height={32} alt="cash" />
            </div>
            <div>
              <span className={homeStyles.statLabel}>{t.labelCash}</span>
              <div className={homeStyles.statValue}>{wallets[selectedId]?.cash?.toFixed(2) || "0.00"} $</div>
            </div>
          </div>

          <div className={homeStyles.statCard} style={{ display: 'flex', alignItems: 'center', padding: '20px'}}>
            <div style={{ marginRight: '15px', display: 'flex', alignItems: 'center' }}>
              <Image src="/assets/total.svg" width={32} height={32} alt="total" />
            </div>
            <div>
              <span className={homeStyles.statLabel}>{t.labelTotal}</span>
              <div className={homeStyles.statValue}>{totalValue.toFixed(2)} $</div>
            </div>
          </div>
        </div>

        <div id="tour-wallet-table" className={homeStyles.assetCard} style={{ padding: '25px', borderRadius: '15px', backgroundColor: '#fff' }}>
          <TableWallet
            selectedId={selectedId}
            activeWalletTransactions={wallets[selectedId]?.transactions}
            lang={lang} // Vous pouvez aussi passer la langue au tableau pour traduire ses colonnes
          />
        </div>
      </main>
    </>
  );
}

Wallet.getLayout = function getLayout(page: ReactNode) {
  return <DashBoardLayout>{page}</DashBoardLayout>;
};